using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using System.Security.Claims;
using SuiviFinancier.DTOs;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers.Api
{
    [Route("api/budgets")]
    [ApiController]
    [Authorize]
    public class BudgetsApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<BudgetsApiController> _logger;

        public BudgetsApiController(AppDbContext context, ILogger<BudgetsApiController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/budgets
        /// Récupérer tous les budgets de l'utilisateur
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBudgets([FromQuery] bool? active = null)
        {
            var userId = User.GetUserIdInt();
            var query = _context.Budgets
                .Where(b => b.UserId == userId);

            // Filtrer par budgets actifs si demandé
            if (active.HasValue && active.Value)
            {
                var now = DateTime.Now;
                query = query.Where(b => b.StartDate <= now && b.EndDate >= now);
            }

            var budgets = await query
                .OrderByDescending(b => b.StartDate)
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.Amount,
                    b.StartDate,
                    b.EndDate,
                    b.CategoryId,
                    b.UserId,
                    Category = b.Category == null ? null : new
                    {
                        b.Category.Id,
                        b.Category.Name,
                        b.Category.Type,
                        b.Category.Icon,
                        b.Category.Color
                    }
                })
                .ToListAsync();

            _logger.LogInformation($"💰 {budgets.Count} budget(s) récupéré(s) pour l'utilisateur {userId}");
            return Ok(budgets);
        }

        /// <summary>
        /// GET: api/budgets/5
        /// Récupérer un budget par son ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Budget>> GetBudget(int id)
        {
            var userId = User.GetUserIdInt();
            var budget = await _context.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (budget == null)
            {
                return NotFound(new { message = "Budget introuvable" });
            }

            return Ok(budget);
        }

        /// <summary>
        /// GET: api/budgets/5/progress
        /// Récupérer la progression d'un budget
        /// </summary>
        [HttpGet("{id}/progress")]
        public async Task<ActionResult> GetBudgetProgress(int id)
        {
            var userId = User.GetUserIdInt();
            var budget = await _context.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (budget == null)
            {
                return NotFound(new { message = "Budget introuvable" });
            }

            // Calculer les dépenses pour cette catégorie dans la période du budget
            var spent = await _context.Transactions
                .Where(t => t.UserId == userId &&
                           t.CategoryId == budget.CategoryId &&
                           t.Type == "Expense" &&
                           t.Date >= budget.StartDate &&
                           t.Date <= budget.EndDate)
                .SumAsync(t => t.Amount);

            var remaining = budget.Amount - spent;
            var percentageUsed = budget.Amount > 0 ? (spent / budget.Amount) * 100 : 0;

            return Ok(new
            {
                budgetId = budget.Id,
                budgetName = budget.Name,
                budgetAmount = budget.Amount,
                spent,
                remaining,
                percentageUsed = Math.Round(percentageUsed, 2),
                isExceeded = spent > budget.Amount,
                categoryName = budget.Category?.Name,
                startDate = budget.StartDate,
                endDate = budget.EndDate
            });
        }

        /// <summary>
        /// GET: api/budgets/summary
        /// Récupérer un résumé de tous les budgets actifs
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult> GetBudgetsSummary()
        {
            var userId = User.GetUserIdInt();
            var now = DateTime.Now;
            
            var activeBudgets = await _context.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId && b.StartDate <= now && b.EndDate >= now)
                .ToListAsync();

            var summaries = new List<object>();

            foreach (var budget in activeBudgets)
            {
                var spent = await _context.Transactions
                    .Where(t => t.UserId == userId &&
                               t.CategoryId == budget.CategoryId &&
                               t.Type == "Expense" &&
                               t.Date >= budget.StartDate &&
                               t.Date <= budget.EndDate)
                    .SumAsync(t => t.Amount);

                summaries.Add(new
                {
                    budgetId = budget.Id,
                    budgetName = budget.Name,
                    categoryName = budget.Category?.Name,
                    budgetAmount = budget.Amount,
                    spent,
                    remaining = budget.Amount - spent,
                    percentageUsed = budget.Amount > 0 ? Math.Round((spent / budget.Amount) * 100, 2) : 0,
                    isExceeded = spent > budget.Amount
                });
            }

            return Ok(summaries);
        }

        /// <summary>
        /// POST: api/budgets
        /// Créer un nouveau budget
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Budget>> CreateBudget([FromBody] CreateBudgetDTO dto)
        {
            var userId = User.GetUserIdInt();
            
            if (userId == 0)
            {
                return BadRequest(new { message = "Token JWT invalide - UserId manquant" });
            }

            // Vérifier que la catégorie appartient à l'utilisateur
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.UserId == userId);

            if (category == null)
            {
                return BadRequest(new { message = "Catégorie invalide" });
            }

            // Créer le budget depuis le DTO
            var budget = new Budget
            {
                Name = dto.Name,
                Amount = dto.Amount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                CategoryId = dto.CategoryId,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            // Vérifier qu'il n'y a pas de chevauchement de budgets pour cette catégorie
            var overlappingBudget = await _context.Budgets
                .AnyAsync(b => b.UserId == userId &&
                              b.CategoryId == budget.CategoryId &&
                              b.Id != budget.Id &&
                              ((budget.StartDate >= b.StartDate && budget.StartDate <= b.EndDate) ||
                               (budget.EndDate >= b.StartDate && budget.EndDate <= b.EndDate) ||
                               (budget.StartDate <= b.StartDate && budget.EndDate >= b.EndDate)));

            if (overlappingBudget)
            {
                return BadRequest(new { message = "Un budget existe déjà pour cette catégorie sur cette période" });
            }

            _context.Budgets.Add(budget);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Nouveau budget créé : {budget.Name} - {budget.Amount} MAD (ID: {budget.Id})");

            // Recharger avec la relation Category
            var createdBudget = await _context.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(b => b.Id == budget.Id);

            return CreatedAtAction(nameof(GetBudget), new { id = budget.Id }, createdBudget);
        }

        /// <summary>
        /// PUT: api/budgets/5
        /// Modifier un budget existant
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBudget(int id, [FromBody] UpdateBudgetDTO dto)
        {
            var userId = User.GetUserIdInt();
            
            if (userId == 0)
            {
                return BadRequest(new { message = "Token JWT invalide - UserId manquant" });
            }

            var existingBudget = await _context.Budgets
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (existingBudget == null)
            {
                return NotFound(new { message = "Budget introuvable" });
            }

            // Créer le budget mis à jour depuis le DTO
            var budget = new Budget
            {
                Id = id,
                Name = dto.Name,
                Amount = dto.Amount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                CategoryId = dto.CategoryId,
                UserId = userId,
                CreatedAt = existingBudget.CreatedAt
            };

            // Vérifier chevauchement
            var overlappingBudget = await _context.Budgets
                .AnyAsync(b => b.UserId == userId &&
                              b.CategoryId == budget.CategoryId &&
                              b.Id != budget.Id &&
                              ((budget.StartDate >= b.StartDate && budget.StartDate <= b.EndDate) ||
                               (budget.EndDate >= b.StartDate && budget.EndDate <= b.EndDate) ||
                               (budget.StartDate <= b.StartDate && budget.EndDate >= b.EndDate)));

            if (overlappingBudget)
            {
                return BadRequest(new { message = "Un budget existe déjà pour cette catégorie sur cette période" });
            }

            _context.Entry(budget).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"✏️ Budget modifié : {budget.Name} (ID: {budget.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Budgets.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// DELETE: api/budgets/5
        /// Supprimer un budget
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudget(int id)
        {
            var userId = User.GetUserIdInt();
            var budget = await _context.Budgets
                .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

            if (budget == null)
            {
                return NotFound(new { message = "Budget introuvable" });
            }

            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"🗑️ Budget supprimé : {budget.Name} (ID: {budget.Id})");
            return NoContent();
        }
    }
}
