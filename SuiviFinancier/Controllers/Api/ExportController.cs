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
    public class ExportController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ExportService _exportService;
        private readonly ILogger<ExportController> _logger;

        public ExportController(
            AppDbContext context,
            ExportService exportService,
            ILogger<ExportController> logger)
        {
            _context = context;
            _exportService = exportService;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/export/transactions/csv
        /// Exporter toutes les transactions en CSV
        /// </summary>
        [HttpGet("transactions/csv")]
        public async Task<IActionResult> ExportTransactionsCsv(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var userId = User.GetUserIdInt();
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "user";

            var query = _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(t => t.Date >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.Date <= endDate.Value);

            var transactions = await query.OrderByDescending(t => t.Date).ToListAsync();

            var csvBytes = _exportService.ExportTransactionsToCsv(transactions);

            return File(csvBytes, "text/csv", $"transactions_{DateTime.Now:yyyyMMdd}.csv");
        }

        /// <summary>
        /// GET: api/export/transactions/excel
        /// Exporter toutes les transactions en Excel
        /// </summary>
        [HttpGet("transactions/excel")]
        public async Task<IActionResult> ExportTransactionsExcel(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var userId = User.GetUserIdInt();
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "user";

            var query = _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(t => t.Date >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.Date <= endDate.Value);

            var transactions = await query.OrderByDescending(t => t.Date).ToListAsync();

            var excelBytes = _exportService.ExportTransactionsToExcel(transactions, userEmail);

            return File(excelBytes, 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"transactions_{DateTime.Now:yyyyMMdd}.xlsx");
        }

        /// <summary>
        /// GET: api/export/budgets/pdf
        /// Exporter les budgets en PDF
        /// </summary>
        [HttpGet("budgets/pdf")]
        public async Task<IActionResult> ExportBudgetsPdf()
        {
            var userId = User.GetUserIdInt();
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "user";

            var budgets = await _context.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.StartDate)
                .ToListAsync();

            // Calculer le total dépensé
            var totalSpent = await _context.Transactions
                .Where(t => t.UserId == userId && t.Type == "Dépense")
                .SumAsync(t => t.Amount);

            var pdfBytes = _exportService.ExportBudgetsToPdf(budgets, userEmail, totalSpent);

            return File(pdfBytes, "application/pdf", $"budgets_{DateTime.Now:yyyyMMdd}.pdf");
        }

        /// <summary>
        /// GET: api/export/report/monthly
        /// Générer un rapport mensuel en PDF
        /// </summary>
        [HttpGet("report/monthly")]
        public async Task<IActionResult> GenerateMonthlyReport(
            [FromQuery] int year,
            [FromQuery] int month)
        {
            var userId = User.GetUserIdInt();
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "user";

            // Date de début et fin du mois
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            // Récupérer les transactions du mois
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId && t.Date >= startDate && t.Date <= endDate)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            // Récupérer les budgets actifs
            var budgets = await _context.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId && 
                           b.StartDate <= endDate && 
                           b.EndDate >= startDate)
                .ToListAsync();

            // Calculer les statistiques
            var totalIncome = transactions.Where(t => t.Type == "Revenu").Sum(t => t.Amount);
            var totalExpense = transactions.Where(t => t.Type == "Dépense").Sum(t => t.Amount);
            var balance = totalIncome - totalExpense;

            var pdfBytes = _exportService.GenerateMonthlyReport(
                userEmail,
                startDate,
                transactions,
                budgets,
                totalIncome,
                totalExpense,
                balance);

            return File(pdfBytes, "application/pdf", $"rapport_{year}_{month:00}.pdf");
        }

        /// <summary>
        /// GET: api/export/report/current-month
        /// Générer le rapport du mois en cours
        /// </summary>
        [HttpGet("report/current-month")]
        public async Task<IActionResult> GenerateCurrentMonthReport()
        {
            var now = DateTime.Now;
            return await GenerateMonthlyReport(now.Year, now.Month);
        }
    }
}
