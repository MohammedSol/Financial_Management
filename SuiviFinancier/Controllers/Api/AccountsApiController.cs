using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Data;
using SuiviFinancier.Models;
using SuiviFinancier.DTOs; // Assurez-vous d'avoir le namespace des DTOs
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using System;

namespace SuiviFinancier.Controllers.Api
{
    [Route("api/accounts")]
    [ApiController]
    [Authorize] // Protégé par JWT
    public class AccountsApiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AccountsApiController(AppDbContext context)
        {
            _context = context;
        }

        // Helper pour récupérer l'ID utilisateur de façon sécurisée
        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim != null && int.TryParse(idClaim.Value, out int userId))
                return userId;
            throw new UnauthorizedAccessException("Utilisateur non identifié");
        }

        // --- 1. DASHBOARD INTELLIGENT ---
        [HttpGet("dashboard")]
        public async Task<ActionResult<AccountsDashboardDto>> GetDashboard()
        {
            var userId = GetUserId();

            var accounts = await _context.Accounts
                .Where(a => a.UserId == userId)
                .ToListAsync();

            // Calculs
            var total = accounts.Sum(a => a.Balance);
            
            var allocation = accounts
                .GroupBy(a => a.Type)
                .Select(g => new AssetAllocationDto 
                { 
                    Name = g.Key, 
                    Value = g.Sum(a => a.Balance) 
                })
                .ToList();

            var accountDtos = accounts.Select(a => new AccountDto
            {
                Id = a.Id,
                Name = a.Name,
                AccountNumber = a.AccountNumber,
                Balance = a.Balance,
                Currency = a.Currency,
                TargetAmount = a.TargetAmount ?? 0,
                Type = a.Type
            }).ToList();

            return Ok(new AccountsDashboardDto
            {
                TotalBalance = total,
                Accounts = accountDtos,
                Allocation = allocation
            });
        }

        // --- 2. CREER UN COMPTE ---
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAccountDto dto)
        {
            var userId = GetUserId();

            var account = new Account
            {
                Name = dto.Name,
                AccountNumber = dto.AccountNumber,
                Balance = dto.Balance,
                Currency = dto.Currency,
                Type = dto.Type,
                TargetAmount = dto.TargetAmount,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Compte créé", id = account.Id });
        }

        // --- 3. MODIFIER UN COMPTE ---
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateAccountDto dto)
        {
            var userId = GetUserId();
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            
            if (account == null) return NotFound(new { message = "Compte introuvable" });

            account.Name = dto.Name;
            account.AccountNumber = dto.AccountNumber;
            account.Type = dto.Type;
            account.Currency = dto.Currency;
            account.TargetAmount = dto.TargetAmount;
            // Note: On met à jour le solde manuellement ici
            account.Balance = dto.Balance; 

            await _context.SaveChangesAsync();
            return Ok(new { message = "Compte mis à jour" });
        }

        // --- 4. SUPPRIMER UN COMPTE ---
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            
            if (account == null) return NotFound(new { message = "Compte introuvable" });

            // Supprimer les transactions liées d'abord (Nettoyage)
            var transactions = _context.Transactions.Where(t => t.AccountId == id);
            _context.Transactions.RemoveRange(transactions);

            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Compte supprimé" });
        }
    }
}