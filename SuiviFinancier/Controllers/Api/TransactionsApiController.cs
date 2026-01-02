using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using System.Security.Claims;
using SuiviFinancier.ML;
using SuiviFinancier.Services;
using SuiviFinancier.DTOs;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers.Api
{
    [Route("api/transactions")]
    [ApiController]
    [Authorize]
    public class TransactionsApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TransactionsApiController> _logger;
        private readonly CategoryPredictorService _predictorService;
        private readonly NotificationService _notificationService;

        public TransactionsApiController(
            AppDbContext context, 
            ILogger<TransactionsApiController> logger,
            CategoryPredictorService predictorService,
            NotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _predictorService = predictorService;
            _notificationService = notificationService;
        }

        /// <summary>
        /// GET: api/transactions
        /// Récupérer toutes les transactions de l'utilisateur
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTransactions(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? accountId = null,
            [FromQuery] string? type = null)
        {
            var userId = User.GetUserIdInt();
            var query = _context.Transactions
                .Where(t => t.UserId == userId);

            // Filtres optionnels
            if (startDate.HasValue)
                query = query.Where(t => t.Date >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.Date <= endDate.Value);

            if (categoryId.HasValue)
                query = query.Where(t => t.CategoryId == categoryId.Value);

            if (accountId.HasValue)
                query = query.Where(t => t.AccountId == accountId.Value);

            if (!string.IsNullOrEmpty(type))
                query = query.Where(t => t.Type == type);

            var transactions = await query
                .OrderByDescending(t => t.Date)
                .Select(t => new
                {
                    t.Id,
                    t.Description,
                    t.Amount,
                    t.Type,
                    t.Date,
                    t.CategoryId,
                    t.AccountId,
                    t.UserId,
                    Category = t.Category == null ? null : new
                    {
                        t.Category.Id,
                        t.Category.Name,
                        t.Category.Type,
                        t.Category.Icon,
                        t.Category.Color
                    },
                    Account = t.Account == null ? null : new
                    {
                        t.Account.Id,
                        t.Account.Name,
                        t.Account.Type,
                        t.Account.Currency
                    }
                })
                .ToListAsync();

            _logger.LogInformation($"💸 {transactions.Count} transaction(s) récupérée(s) pour l'utilisateur {userId}");
            return Ok(transactions);
        }

        /// <summary>
        /// GET: api/transactions/5
        /// Récupérer une transaction par son ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Transaction>> GetTransaction(int id)
        {
            var userId = User.GetUserIdInt();
            var transaction = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
            {
                return NotFound(new { message = "Transaction introuvable" });
            }

            return Ok(transaction);
        }

        /// <summary>
        /// GET: api/transactions/recent?limit=10
        /// Récupérer les transactions récentes
        /// </summary>
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetRecentTransactions([FromQuery] int limit = 10)
        {
            var userId = User.GetUserIdInt();
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date)
                .Take(limit)
                .ToListAsync();

            return Ok(transactions);
        }

        /// <summary>
        /// GET: api/transactions/summary
        /// Récupérer un résumé des transactions (revenus, dépenses, solde)
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult> GetTransactionsSummary(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var userId = User.GetUserIdInt();
            var query = _context.Transactions.Where(t => t.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(t => t.Date >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.Date <= endDate.Value);

            var transactions = await query.ToListAsync();

            // Supporter les types en français ET en anglais
            var totalIncome = transactions.Where(t => 
                t.Type == "Income" || t.Type == "Revenu").Sum(t => t.Amount);
            var totalExpense = transactions.Where(t => 
                t.Type == "Expense" || t.Type == "Dépense" || t.Type == "Depense").Sum(t => t.Amount);
            var balance = totalIncome - totalExpense;

            return Ok(new
            {
                totalIncome,
                totalExpense,
                balance,
                transactionCount = transactions.Count
            });
        }

        /// <summary>
        /// POST: api/transactions
        /// Créer une nouvelle transaction
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Transaction>> CreateTransaction([FromBody] CreateTransactionDTO dto)
        {
            _logger.LogInformation("🔍 Requête POST /api/transactions reçue");
            _logger.LogInformation("🔍 Claims reçus: {Claims}", string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));
            _logger.LogInformation("🔍 IsAuthenticated: {IsAuth}", User.Identity?.IsAuthenticated);
            
            var userId = User.GetUserIdInt();
            _logger.LogInformation("🔍 UserId extrait: {UserId}", userId);
            
            if (userId == 0)
            {
                _logger.LogError("❌ UserId est invalide (0)");
                return BadRequest(new { message = "Token JWT invalide - UserId manquant" });
            }

            // Créer la transaction depuis le DTO
            var transaction = new Transaction
            {
                Description = dto.Description,
                Amount = dto.Amount,
                Date = dto.Date,
                Type = dto.Type,
                CategoryId = dto.CategoryId,
                AccountId = dto.AccountId,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            // Vérifier que la catégorie appartient à l'utilisateur
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == transaction.CategoryId && c.UserId == userId);

            if (category == null)
            {
                return BadRequest(new { message = "Catégorie invalide" });
            }

            // Vérifier que le compte appartient à l'utilisateur
            var account = await _context.Accounts
                .FirstOrDefaultAsync(a => a.Id == transaction.AccountId && a.UserId == userId);

            if (account == null)
            {
                return BadRequest(new { message = "Compte invalide" });
            }

            _context.Transactions.Add(transaction);

            // Mettre à jour le solde du compte
            if (transaction.Type == "Income")
            {
                account.Balance += transaction.Amount;
            }
            else if (transaction.Type == "Expense")
            {
                account.Balance -= transaction.Amount;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Nouvelle transaction créée : {transaction.Description} - {transaction.Amount} MAD (ID: {transaction.Id})");

            // 🔔 Vérifier et envoyer notifications
            await _notificationService.NotifyImportantTransactionAsync(userId!, transaction);
            await _notificationService.CheckBudgetAlertsAsync(userId);

            // Recharger avec les relations
            var createdTransaction = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.Id == transaction.Id);

            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, createdTransaction);
        }

        /// <summary>
        /// PUT: api/transactions/5
        /// Modifier une transaction existante
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(int id, [FromBody] UpdateTransactionDto dto)
        {
            var userId = User.GetUserIdInt();
            
            if (userId == 0)
            {
                return BadRequest(new { message = "Token JWT invalide - UserId manquant" });
            }

            var existingTransaction = await _context.Transactions
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (existingTransaction == null)
            {
                return NotFound(new { message = "Transaction introuvable" });
            }

            // Créer la transaction mise à jour depuis le DTO
            var transaction = new Transaction
            {
                Id = id,
                Description = dto.Description,
                Amount = dto.Amount,
                Date = dto.Date,
                Type = dto.Type,
                CategoryId = dto.CategoryId,
                AccountId = dto.AccountId,
                UserId = userId,
                CreatedAt = existingTransaction.CreatedAt
            };

            // Recalculer le solde du compte
            var account = await _context.Accounts.FindAsync(existingTransaction.AccountId);
            if (account != null)
            {
                // Annuler l'ancienne transaction
                if (existingTransaction.Type == "Income")
                    account.Balance -= existingTransaction.Amount;
                else if (existingTransaction.Type == "Expense")
                    account.Balance += existingTransaction.Amount;

                // Appliquer la nouvelle transaction
                if (transaction.Type == "Income")
                    account.Balance += transaction.Amount;
                else if (transaction.Type == "Expense")
                    account.Balance -= transaction.Amount;
            }

            _context.Entry(transaction).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"✏️ Transaction modifiée : {transaction.Description} (ID: {transaction.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Transactions.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// DELETE: api/transactions/5
        /// Supprimer une transaction
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(int id)
        {
            var userId = User.GetUserIdInt();
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (transaction == null)
            {
                return NotFound(new { message = "Transaction introuvable" });
            }

            // Mettre à jour le solde du compte
            var account = await _context.Accounts.FindAsync(transaction.AccountId);
            if (account != null)
            {
                if (transaction.Type == "Income")
                    account.Balance -= transaction.Amount;
                else if (transaction.Type == "Expense")
                    account.Balance += transaction.Amount;
            }

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"🗑️ Transaction supprimée : {transaction.Description} (ID: {transaction.Id})");
            return NoContent();
        }

        /// <summary>
        /// GET: api/transactions/suggest-category?description=Courses Carrefour
        /// Suggérer une catégorie en utilisant ML
        /// </summary>
        [HttpGet("suggest-category")]
        public async Task<ActionResult> SuggestCategory([FromQuery] string description)
        {
            if (string.IsNullOrWhiteSpace(description))
            {
                return BadRequest(new { message = "Description requise" });
            }

            try
            {
                var userId = User.GetUserIdInt();
                
                // Prédire le nom de la catégorie
                string predictedCategoryName = _predictorService.PredictCategory(description);

                // Chercher la catégorie correspondante dans la base
                var category = await _context.Categories
                    .Where(c => c.UserId == userId && c.Name == predictedCategoryName)
                    .FirstOrDefaultAsync();

                if (category != null)
                {
                    return Ok(new
                    {
                        categoryId = category.Id,
                        categoryName = category.Name,
                        confidence = "High"
                    });
                }
                else
                {
                    // Si la catégorie n'existe pas pour cet utilisateur, retourner juste le nom
                    return Ok(new
                    {
                        categoryId = (int?)null,
                        categoryName = predictedCategoryName,
                        confidence = "Medium",
                        message = $"Catégorie '{predictedCategoryName}' suggérée mais non trouvée dans vos catégories"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erreur lors de la suggestion de catégorie: {ex.Message}");
                return StatusCode(500, new
                {
                    message = "Impossible de suggérer une catégorie. Le modèle ML doit être entraîné d'abord.",
                    error = ex.Message
                });
            }
        }
    }
}
