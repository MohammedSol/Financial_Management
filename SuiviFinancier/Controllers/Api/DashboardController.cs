using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.DTOs;
using SuiviFinancier.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Claims;

namespace SuiviFinancier.Controllers.Api
{
    [Route("api/dashboard")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DashboardController(AppDbContext context) { _context = context; }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim != null && int.TryParse(idClaim.Value, out int userId))
                return userId;
            throw new UnauthorizedAccessException("Utilisateur non identifié");
        }

        [HttpGet]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            var userId = GetUserId();
            var accounts = await _context.Accounts.Where(a => a.UserId == userId).ToListAsync();
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .Take(5)
                .Include(t => t.Category)
                .ToListAsync();

            var totalBalance = accounts.Sum(a => a.Balance);
            var totalIncome = await _context.Transactions.Where(t => t.UserId == userId && t.Amount > 0).SumAsync(t => (decimal?)t.Amount) ?? 0;
            var totalExpense = await _context.Transactions.Where(t => t.UserId == userId && t.Amount < 0).SumAsync(t => (decimal?)t.Amount) ?? 0;

            var allocation = accounts
                .GroupBy(a => a.Type)
                .Select(g => new AssetAllocationDto { Name = g.Key, Value = g.Sum(a => a.Balance) })
                .ToList();

            var categoryTotals = await _context.Transactions
                .Where(t => t.UserId == userId && t.Category != null)
                .GroupBy(t => t.Category.Name)
                .Select(g => new { Category = g.Key, Total = g.Sum(t => t.Amount) })
                .ToDictionaryAsync(x => x.Category, x => x.Total);

            return Ok(new DashboardDto
            {
                TotalBalance = totalBalance,
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                Accounts = accounts.Select(a => new AccountDto {
                    Id = a.Id,
                    Name = a.Name,
                    AccountNumber = a.AccountNumber,
                    Currency = a.Currency,
                    Type = a.Type,
                    Balance = a.Balance,
                    TargetAmount = a.TargetAmount ?? 0
                }).ToList(),
                RecentTransactions = transactions.Select(t => new TransactionDto {
                    Id = t.Id,
                    Amount = t.Amount,
                    Date = t.Date,
                    Description = t.Description,
                    Category = t.Category != null ? t.Category.Name : null,
                    AccountId = t.AccountId ?? 0
                }).ToList(),
                Allocation = allocation,
                CategoryTotals = categoryTotals
            });
        }
    }
}
