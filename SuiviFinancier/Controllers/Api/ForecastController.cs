using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.ML;
using SuiviFinancier.Data;
using SuiviFinancier.Models;
using System.Security.Claims;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers.Api
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ForecastController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ForecastController> _logger;

        public ForecastController(AppDbContext context, ILogger<ForecastController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/forecast/balance
        /// Prévision du solde avec séries temporelles (ML.NET SSA)
        /// </summary>
        [HttpGet("balance")]
        public async Task<ActionResult> GetBalanceForecast(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = User.GetUserIdInt();
                if (userId == 0)
                {
                    return Unauthorized(new { message = "Utilisateur non authentifié" });
                }

                // Par défaut : du 1er du mois en cours à la fin du mois
                if (!startDate.HasValue)
                {
                    startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                }
                if (!endDate.HasValue)
                {
                    endDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, DateTime.DaysInMonth(DateTime.Today.Year, DateTime.Today.Month));
                }

                // Récupérer les transactions de l'utilisateur dans la période
                var transactionsFiltered = await _context.Transactions
                    .Include(t => t.Category)
                    .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= endDate)
                    .OrderBy(t => t.Date)
                    .ToListAsync();

                // Calculer le solde initial
                var totalActualBalance = await _context.Accounts
                    .Where(a => a.UserId == userId)
                    .SumAsync(a => (decimal?)a.Balance) ?? 0;

                var netFlowSinceStart = transactionsFiltered
                    .Sum(t => t.Type == "Income" || t.Type == "Revenu" ? t.Amount : -t.Amount);

                var startingBalance = totalActualBalance - netFlowSinceStart;

                // Construire l'historique jour par jour
                var dailyBalancesHistory = new List<DailyBalance>();
                var cumulativeBalance = startingBalance;
                var today = DateTime.Today.Date;
                var yesterday = today.AddDays(-1);

                for (var date = startDate.Value.Date; date <= yesterday && date <= endDate.Value.Date; date = date.AddDays(1))
                {
                    var netFlowDay = transactionsFiltered
                        .Where(t => t.Date.Date == date)
                        .Sum(t => t.Type == "Income" || t.Type == "Revenu" ? t.Amount : -t.Amount);

                    cumulativeBalance += netFlowDay;
                    dailyBalancesHistory.Add(new DailyBalance { Balance = (float)cumulativeBalance });
                }

                // Calculer les jours à prédire
                var daysToForecast = (endDate.Value.Date - today).Days + 1;
                if (daysToForecast < 1) daysToForecast = 1;

                // Préparer les données de sortie
                var historicalData = new List<object>();
                var forecastData = new List<object>();
                bool usedMachineLearning = false;
                int minimumHistoryDays = 7;

                // Construction de l'historique
                cumulativeBalance = startingBalance;
                for (var date = startDate.Value.Date; date <= today && date <= endDate.Value.Date; date = date.AddDays(1))
                {
                    var netFlowDay = transactionsFiltered
                        .Where(t => t.Date.Date == date)
                        .Sum(t => t.Type == "Income" || t.Type == "Revenu" ? t.Amount : -t.Amount);

                    cumulativeBalance += netFlowDay;
                    historicalData.Add(new
                    {
                        date = date.ToString("yyyy-MM-dd"),
                        balance = Math.Round(cumulativeBalance, 2),
                        type = "historical"
                    });
                }

                // Prévision ML.NET ou mathématique
                if (dailyBalancesHistory.Count >= minimumHistoryDays)
                {
                    try
                    {
                        var mlContext = new MLContext(seed: 1);
                        IDataView dataView = mlContext.Data.LoadFromEnumerable(dailyBalancesHistory);

                        var forecastingPipeline = mlContext.Forecasting.ForecastBySsa(
                            outputColumnName: nameof(BalancePrediction.ForecastedValues),
                            inputColumnName: nameof(DailyBalance.Balance),
                            windowSize: Math.Min(7, dailyBalancesHistory.Count / 2),
                            seriesLength: dailyBalancesHistory.Count,
                            trainSize: dailyBalancesHistory.Count,
                            horizon: daysToForecast,
                            confidenceLevel: 0.95f
                        );

                        var model = forecastingPipeline.Fit(dataView);
                        var predictionEngine = mlContext.Model.CreatePredictionEngine<DailyBalance, BalancePrediction>(model);
                        var forecast = predictionEngine.Predict(dailyBalancesHistory.Last());

                        if (forecast?.ForecastedValues != null && forecast.ForecastedValues.Length > 0)
                        {
                            for (int i = 0; i < forecast.ForecastedValues.Length; i++)
                            {
                                var date = today.AddDays(i + 1);
                                if (date <= endDate.Value.Date)
                                {
                                    forecastData.Add(new
                                    {
                                        date = date.ToString("yyyy-MM-dd"),
                                        balance = Math.Round((decimal)forecast.ForecastedValues[i], 2),
                                        type = "forecast_ml"
                                    });
                                }
                            }
                            usedMachineLearning = true;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"ML.NET SSA échoué: {ex.Message}. Utilisation de la projection mathématique.");
                    }
                }

                // Fallback: projection mathématique
                if (!usedMachineLearning)
                {
                    var daysPassed = (today - startDate.Value.Date).Days + 1;
                    var dailyAverage = daysPassed > 3 ? netFlowSinceStart / daysPassed : 0;

                    var lastBalance = historicalData.Count > 0 
                        ? (decimal)(historicalData.LastOrDefault() as dynamic)?.balance 
                        : cumulativeBalance;
                    for (int i = 1; i <= daysToForecast; i++)
                    {
                        var date = today.AddDays(i);
                        if (date <= endDate.Value.Date)
                        {
                            lastBalance += dailyAverage;
                            forecastData.Add(new
                            {
                                date = date.ToString("yyyy-MM-dd"),
                                balance = Math.Round(lastBalance, 2),
                                type = "forecast_math"
                            });
                        }
                    }
                }

                return Ok(new
                {
                    startDate = startDate.Value.ToString("yyyy-MM-dd"),
                    endDate = endDate.Value.ToString("yyyy-MM-dd"),
                    startingBalance = Math.Round(startingBalance, 2),
                    currentBalance = Math.Round(cumulativeBalance, 2),
                    historicalData,
                    forecastData,
                    usedMachineLearning,
                    minimumHistoryDays,
                    historicalDays = dailyBalancesHistory.Count,
                    forecastDays = forecastData.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erreur lors de la prévision: {ex.Message}");
                return StatusCode(500, new { message = "Erreur lors de la prévision", error = ex.Message });
            }
        }
    }
}
