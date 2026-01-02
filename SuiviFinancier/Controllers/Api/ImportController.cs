using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using SuiviFinancier.Services;
using System.Security.Claims;
using SuiviFinancier.Extensions;

namespace SuiviFinancier.Controllers.Api
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ImportService _importService;
        private readonly ILogger<ImportController> _logger;

        public ImportController(
            AppDbContext context,
            ImportService importService,
            ILogger<ImportController> logger)
        {
            _context = context;
            _importService = importService;
            _logger = logger;
        }

        /// <summary>
        /// POST: api/import/transactions/csv
        /// Importer des transactions depuis un fichier CSV
        /// </summary>
        [HttpPost("transactions/csv")]
        public async Task<IActionResult> ImportTransactionsCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Aucun fichier fourni" });
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Le fichier doit être au format CSV" });
            }

            var userId = User.GetUserIdInt();

            // Récupérer les catégories et comptes de l'utilisateur
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .ToDictionaryAsync(c => c.Name, c => c.Id);

            var accounts = await _context.Accounts
                .Where(a => a.UserId == userId)
                .ToDictionaryAsync(a => a.Name, a => a.Id);

            try
            {
                using var stream = file.OpenReadStream();var result = _importService.ImportTransactionsFromCsv(
                    stream,
                    userId!,
                    categories,
                    accounts);

                if (result.SuccessCount == 0 && result.ErrorCount > 0)
                {
                    return BadRequest(new
                    {
                        message = "Aucune transaction importée",
                        errors = result.Errors
                    });
                }

                // Sauvegarder les transactions valides
                if (result.Transactions.Any())
                {
                    _context.Transactions.AddRange(result.Transactions);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"✅ Import réussi : {result.SuccessCount} transactions pour {User.FindFirstValue(ClaimTypes.Email)}");
                }

                return Ok(new
                {
                    message = $"Import terminé : {result.SuccessCount} réussies, {result.ErrorCount} erreurs",
                    successCount = result.SuccessCount,
                    errorCount = result.ErrorCount,
                    errors = result.Errors,
                    transactions = result.Transactions.Select(t => new
                    {
                        t.Id,
                        t.Date,
                        t.Type,
                        t.Amount,
                        t.Description
                    })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de l'import CSV");
                return StatusCode(500, new { message = "Erreur lors de l'import", error = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/import/template/csv
        /// Télécharger un template CSV pour l'import
        /// </summary>
        [HttpGet("template/csv")]
        public IActionResult DownloadCsvTemplate()
        {
            var csv = "Date,Type,Montant,Description,Catégorie,Compte\n" +
                      "2024-12-20,Dépense,150.50,\"Courses alimentaires\",Alimentation,Compte Courant\n" +
                      "2024-12-21,Revenu,2500.00,\"Salaire décembre\",Salaire,Compte Épargne\n" +
                      "2024-12-22,Dépense,45.00,\"Restaurant\",Restaurants,Compte Courant\n";

            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", "template_import.csv");
        }

        /// <summary>
        /// GET: api/import/preview
        /// Prévisualiser un fichier CSV avant import
        /// </summary>
        [HttpPost("preview")]
        public async Task<IActionResult> PreviewCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Aucun fichier fourni" });
            }

            try
            {
                var lines = new List<string>();
                using var reader = new StreamReader(file.OpenReadStream());// Lire les 10 premières lignes
                for (int i = 0; i < 11 && !reader.EndOfStream; i++)
                {
                    lines.Add(await reader.ReadLineAsync() ?? "");
                }

                return Ok(new
                {
                    filename = file.FileName,
                    size = file.Length,
                    lines = lines,
                    preview = string.Join("\n", lines)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erreur lors de la lecture du fichier", error = ex.Message });
            }
        }
    }
}
