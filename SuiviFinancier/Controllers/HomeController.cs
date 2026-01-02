using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.ML;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers;

public class HomeController : Controller
{
    private readonly AppDbContext _context;

    public HomeController(AppDbContext context)
    {
        _context = context;
    }

    // Helper pour récupérer l'ID de l'utilisateur connecté
    private int GetUserId()
    {
        return User.GetUserIdInt();
    }

    public async Task<IActionResult> Index(DateTime? startDate, DateTime? endDate)
    {
        var userId = GetUserId(); // ID du User connecté

        // 1. Définir les dates par défaut (Ce mois-ci) si rien n'est envoyé
        if (!startDate.HasValue)
        {
            startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
        }
        if (!endDate.HasValue)
        {
            endDate = startDate.Value.AddMonths(1).AddDays(-1);
        }

        // 2. Récupérer les transactions FILTRÉES par ces dates et l'utilisateur
        var transactionsFiltered = await _context.Transactions
            .Include(t => t.Category)
            .Where(t => t.Date >= startDate && t.Date <= endDate && t.UserId == userId)
            .ToListAsync();

        // 3. Calculer les totaux sur ces données filtrées
        var income = transactionsFiltered
            .Where(t => t.Category != null && t.Category.Type == "Revenu")
            .Sum(t => t.Amount);

        var expense = transactionsFiltered
            .Where(t => t.Category != null && t.Category.Type == "Depense")
            .Sum(t => t.Amount);

        // 4. Préparer les données du Graphique Donut (toujours sur les données filtrées)
        var expenseByCat = transactionsFiltered
            .Where(t => t.Category != null && t.Category.Type == "Depense")
            .GroupBy(t => t.Category!.Name)
            .Select(g => new { 
                Category = g.Key, 
                Total = g.Sum(t => t.Amount) 
            })
            .ToList();

        // 5. Préparer les données du Line Chart (Évolution journalière Revenus/Dépenses)
        var days = new List<DateTime>();
        for (var date = startDate.Value; date <= endDate.Value; date = date.AddDays(1))
        {
            days.Add(date);
        }

        var labels = new List<string>();
        var incomeData = new List<decimal>();
        var expenseData = new List<decimal>();

        foreach (var day in days)
        {
            labels.Add(day.ToString("dd/MM"));

            var dayIncome = transactionsFiltered
                .Where(t => t.Date.Date == day.Date && t.Category != null && t.Category.Type == "Revenu")
                .Sum(t => t.Amount);
            
            var dayExpense = transactionsFiltered
                .Where(t => t.Date.Date == day.Date && t.Category != null && t.Category.Type == "Depense")
                .Sum(t => t.Amount);

            incomeData.Add(dayIncome);
            expenseData.Add(dayExpense);
        }

        // 6. Solde Total (filtrer par UserId)
        var totalBalance = await _context.Accounts
            .Where(a => a.UserId == userId)
            .SumAsync(a => (decimal?)a.Balance) ?? 0;

        // 7. Calcul des Budgets (filtrer par UserId)
        var allBudgets = await _context.Budgets
            .Include(b => b.Category)
            .Where(b => b.UserId == userId)
            .ToListAsync();
        var budgetStatuses = new List<BudgetStatus>();

        foreach (var budget in allBudgets)
        {
            if (budget.Category != null)
            {
                var spentInCategory = transactionsFiltered
                    .Where(t => t.CategoryId == budget.CategoryId && t.Category != null && t.Category.Type == "Depense")
                    .Sum(t => t.Amount);

                budgetStatuses.Add(new BudgetStatus
                {
                    CategoryName = budget.Category.Name,
                    LimitAmount = budget.Amount,
                    SpentAmount = spentInCategory
                });
            }
        }

        budgetStatuses = budgetStatuses.OrderByDescending(b => b.Percentage).ToList();

        // --- DÉBUT DU CALCUL DE LA PRÉVISION ---
        
        // a. Calculer le solde net du mois
        var netFlowThisMonth = income - expense;
        var daysPassed = (DateTime.Today.Date - startDate.Value.Date).Days + 1;
        
        // b. Calculer le Solde Initial du mois (avant la date de début)
        var totalActualBalance = await _context.Accounts
            .Where(a => a.UserId == userId)
            .SumAsync(a => (decimal?)a.Balance) ?? 0;
        var netFlowSinceStart = transactionsFiltered
            .Sum(t => t.Category!.Type == "Revenu" ? t.Amount : -t.Amount);

        var startingBalance = totalActualBalance - netFlowSinceStart;

        // c. Calculer les Données Quotidiennes Historiques pour ML.NET
        var dailyBalancesHistory = new List<DailyBalance>();
        var cumulativeBalance = startingBalance;
        var today = DateTime.Today.Date;
        var yesterday = today.AddDays(-1);

        // Construire l'historique jour par jour jusqu'à hier
        for (var date = startDate.Value.Date; date <= yesterday && date <= endDate.Value.Date; date = date.AddDays(1))
        {
            var netFlowDay = transactionsFiltered
                .Where(t => t.Date.Date == date)
                .Sum(t => t.Category!.Type == "Revenu" ? t.Amount : -t.Amount);

            cumulativeBalance += netFlowDay;
            dailyBalancesHistory.Add(new DailyBalance { Balance = (float)cumulativeBalance });
        }

        // d. Définir le nombre de jours à prédire
        var daysToForecast = (endDate.Value.Date - today).Days + 1;
        if (daysToForecast < 1) daysToForecast = 1;

        // e. Préparer les résultats de prévision
        BalancePrediction? forecast = null;
        bool useSimpleProjection = true;
        var minimumHistoryDays = 7; // Réduire à 7 jours pour tester plus facilement

        // f. Tentative de prévision ML.NET
        if (dailyBalancesHistory.Count >= minimumHistoryDays)
        {
            try
            {
                var mlContext = new MLContext(seed: 1);
                IDataView dataView = mlContext.Data.LoadFromEnumerable(dailyBalancesHistory);

                // Pipeline SSA (Singular Spectrum Analysis)
                var forecastingPipeline = mlContext.Forecasting.ForecastBySsa(
                    outputColumnName: nameof(BalancePrediction.ForecastedValues),
                    inputColumnName: nameof(DailyBalance.Balance),
                    windowSize: Math.Min(7, dailyBalancesHistory.Count / 2),
                    seriesLength: dailyBalancesHistory.Count,
                    trainSize: dailyBalancesHistory.Count,
                    horizon: daysToForecast,
                    confidenceLevel: 0.95f,
                    confidenceLowerBoundColumn: "LowerBound",
                    confidenceUpperBoundColumn: "UpperBound"
                );

                var model = forecastingPipeline.Fit(dataView);
                
                // Créer un PredictionEngine pour faire la prédiction
                var predictionEngine = mlContext.Model.CreatePredictionEngine<DailyBalance, BalancePrediction>(model);
                
                // Faire la prédiction (on passe le dernier point connu)
                forecast = predictionEngine.Predict(dailyBalancesHistory.Last());
                useSimpleProjection = false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur ML.NET : {ex.Message}");
                useSimpleProjection = true;
            }
        }

        // g. Construction de la Liste Finale (Historique + Prévision)
        var cumulativeDataList = new List<decimal>();
        var dateLabelsList = new List<string>();

        // 1. Ajouter l'HISTORIQUE RÉEL
        cumulativeBalance = startingBalance;
        for (var date = startDate.Value.Date; date < today && date <= endDate.Value.Date; date = date.AddDays(1))
        {
            var netFlowDay = transactionsFiltered
                .Where(t => t.Date.Date == date)
                .Sum(t => t.Category!.Type == "Revenu" ? t.Amount : -t.Amount);

            cumulativeBalance += netFlowDay;
            cumulativeDataList.Add(cumulativeBalance);
            dateLabelsList.Add(date.ToString("dd/MM"));
        }

        // Ajouter le solde d'AUJOURD'HUI
        var todayNetFlow = transactionsFiltered
            .Where(t => t.Date.Date == today)
            .Sum(t => t.Category!.Type == "Revenu" ? t.Amount : -t.Amount);
        cumulativeBalance += todayNetFlow;
        cumulativeDataList.Add(cumulativeBalance);
        dateLabelsList.Add(today.ToString("dd/MM"));

        // 2. Définir le point de départ de la prévision
        var forecastStartIndex = cumulativeDataList.Count;

        // 3. Ajouter la PRÉVISION
        if (!useSimpleProjection && forecast != null && forecast.ForecastedValues.Length > 0)
        {
            // Cas ML.NET : Utiliser les prédictions ML
            foreach (var predictedValue in forecast.ForecastedValues)
            {
                var date = today.AddDays(cumulativeDataList.Count - forecastStartIndex + 1);
                if (date <= endDate.Value.Date)
                {
                    dateLabelsList.Add(date.ToString("dd/MM"));
                    cumulativeDataList.Add((decimal)predictedValue);
                }
            }
        }
        else
        {
            // Cas Mathématique : Projection par moyenne journalière
            var dailyNetFlowAverage = daysPassed > 3 ? netFlowThisMonth / daysPassed : 0;

            for (var date = today.AddDays(1).Date; date <= endDate.Value.Date; date = date.AddDays(1))
            {
                cumulativeBalance += dailyNetFlowAverage;
                cumulativeDataList.Add(cumulativeBalance);
                dateLabelsList.Add(date.ToString("dd/MM"));
            }
        }

        // --- FIN DU CALCUL DE LA PRÉVISION ---

        // 8. Remplir le ViewModel
        var vm = new DashboardViewModel
        {
            StartDate = startDate.Value,
            EndDate = endDate.Value,
            TotalBalance = totalBalance,
            Income = income,
            Expense = expense,
            RecentTransactions = transactionsFiltered.OrderByDescending(t => t.Date).Take(5).ToList(),
            ExpenseCategoryLabels = expenseByCat.Select(x => x.Category).ToArray(),
            ExpenseCategoryData = expenseByCat.Select(x => x.Total).ToArray(),
            SplineChartLabels = labels.ToArray(),
            IncomeDailyData = incomeData.ToArray(),
            ExpenseDailyData = expenseData.ToArray(),
            BudgetStatuses = budgetStatuses,
            
            // NOUVEAU : Données de prévision
            CumulativeChartLabels = dateLabelsList.ToArray(),
            CumulativeBalanceData = cumulativeDataList.ToArray(),
            ForecastStartIndex = forecastStartIndex
        };

        return View(vm);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
