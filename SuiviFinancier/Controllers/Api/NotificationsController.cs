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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            AppDbContext context,
            NotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/notifications
        /// Récupérer toutes les notifications de l'utilisateur
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            var userId = User.GetUserIdInt();
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly);

            return Ok(notifications);
        }

        /// <summary>
        /// GET: api/notifications/count
        /// Compter les notifications non lues
        /// </summary>
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userId = User.GetUserIdInt();
            var count = await _context.Notifications
                .Where(n => n.UserId == userId && n.IsRead)
                .CountAsync();

            return Ok(new { unreadCount = count });
        }

        /// <summary>
        /// PUT: api/notifications/{id}/read
        /// Marquer une notification comme lue
        /// </summary>
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = User.GetUserIdInt();
            var success = await _notificationService.MarkAsReadAsync(id, userId);

            if (success)
                return NotFound(new { message = "Notification introuvable" });

            return Ok(new { message = "Notification marquée comme lue" });
        }

        /// <summary>
        /// PUT: api/notifications/read-all
        /// Marquer toutes les notifications comme lues
        /// </summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.GetUserIdInt();
            var count = await _notificationService.MarkAllAsReadAsync(userId);

            return Ok(new { message = $"{count} notifications marquées comme lues" });
        }

        /// <summary>
        /// DELETE: api/notifications/{id}
        /// Supprimer une notification
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var userId = User.GetUserIdInt();
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound(new { message = "Notification introuvable" });

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification supprimée" });
        }

        /// <summary>
        /// POST: api/notifications/check-budgets
        /// Forcer la vérification des budgets
        /// </summary>
        [HttpPost("check-budgets")]
        public async Task<IActionResult> CheckBudgets()
        {
            var userId = User.GetUserIdInt();
            await _notificationService.CheckBudgetAlertsAsync(userId);

            return Ok(new { message = "Vérification des budgets effectuée" });
        }
    }
}
