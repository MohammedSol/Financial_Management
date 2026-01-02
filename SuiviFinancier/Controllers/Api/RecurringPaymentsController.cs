using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using System.Security.Claims;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers.Api
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RecurringPaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RecurringPaymentsController> _logger;

        public RecurringPaymentsController(AppDbContext context, ILogger<RecurringPaymentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/recurringpayments
        /// Récupérer tous les paiements récurrents de l'utilisateur
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecurringPayment>>> GetRecurringPayments()
        {
            var userId = User.GetUserIdInt();

            var payments = await _context.RecurringPayments
                .Include(p => p.Category)
                .Include(p => p.Account)
                .Where(p => p.UserId == userId)
                .OrderBy(p => p.DayOfMonth)
                .ToListAsync();

            return Ok(payments);
        }

        /// <summary>
        /// GET: api/recurringpayments/{id}
        /// Récupérer un paiement récurrent spécifique
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<RecurringPayment>> GetRecurringPayment(int id)
        {
            var userId = User.GetUserIdInt();

            var payment = await _context.RecurringPayments
                .Include(p => p.Category)
                .Include(p => p.Account)
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (payment == null)
                return NotFound(new { message = "Paiement récurrent introuvable" });

            return Ok(payment);
        }

        /// <summary>
        /// POST: api/recurringpayments
        /// Créer un nouveau paiement récurrent
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<RecurringPayment>> CreateRecurringPayment(RecurringPayment payment)
        {
            var userId = User.GetUserIdInt();
            payment.UserId = userId!;
            payment.CreatedAt = DateTime.UtcNow;

            _context.RecurringPayments.Add(payment);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"📅 Paiement récurrent créé : {payment.Name} (Jour {payment.DayOfMonth})");

            return CreatedAtAction(nameof(GetRecurringPayment), new { id = payment.Id }, payment);
        }

        /// <summary>
        /// PUT: api/recurringpayments/{id}
        /// Modifier un paiement récurrent
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecurringPayment(int id, RecurringPayment payment)
        {
            if (id != payment.Id)
                return BadRequest(new { message = "ID incohérent" });

            var userId = User.GetUserIdInt();
            var existingPayment = await _context.RecurringPayments
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (existingPayment == null)
                return NotFound(new { message = "Paiement récurrent introuvable" });

            existingPayment.Name = payment.Name;
            existingPayment.Amount = payment.Amount;
            existingPayment.DayOfMonth = payment.DayOfMonth;
            existingPayment.CategoryId = payment.CategoryId;
            existingPayment.AccountId = payment.AccountId;
            existingPayment.IsActive = payment.IsActive;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"✏️ Paiement récurrent modifié : {payment.Name}");

            return Ok(existingPayment);
        }

        /// <summary>
        /// DELETE: api/recurringpayments/{id}
        /// Supprimer un paiement récurrent
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecurringPayment(int id)
        {
            var userId = User.GetUserIdInt();
            var payment = await _context.RecurringPayments
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (payment == null)
                return NotFound(new { message = "Paiement récurrent introuvable" });

            _context.RecurringPayments.Remove(payment);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"🗑️ Paiement récurrent supprimé : {payment.Name}");

            return Ok(new { message = "Paiement récurrent supprimé" });
        }

        /// <summary>
        /// PUT: api/recurringpayments/{id}/toggle
        /// Activer/Désactiver un paiement récurrent
        /// </summary>
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleRecurringPayment(int id)
        {
            var userId = User.GetUserIdInt();
            var payment = await _context.RecurringPayments
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (payment == null)
                return NotFound(new { message = "Paiement récurrent introuvable" });

            payment.IsActive = !payment.IsActive;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"🔄 Paiement récurrent {(payment.IsActive ? "activé" : "désactivé")} : {payment.Name}");

            return Ok(new { message = $"Paiement {(payment.IsActive ? "activé" : "désactivé")}", isActive = payment.IsActive });
        }
    }
}
