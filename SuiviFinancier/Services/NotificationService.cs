using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Hubs;
using SuiviFinancier.Models;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            AppDbContext context,
            IHubContext<NotificationHub> hubContext,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        /// <summary>
        /// Créer et envoyer une notification à un utilisateur
        /// </summary>
        public async Task<Notification> CreateAndSendAsync(
            int userId,
            string type,
            string title,
            string message,
            string severity = "info",
            int? relatedEntityId = null,
            string? actionUrl = null)
        {
            // Créer la notification en base
            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                Severity = severity,
                RelatedEntityId = relatedEntityId,
                ActionUrl = actionUrl,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Envoyer via SignalR en temps réel
            await SendToUserAsync(userId, notification);

            _logger.LogInformation($"🔔 Notification créée et envoyée : [{type}] {title} → User {userId}");

            return notification;
        }

        /// <summary>
        /// Envoyer une notification via SignalR (sans sauvegarder en base)
        /// </summary>
        private async Task SendToUserAsync(int userId, Notification notification)
        {
            try
            {
                await _hubContext.Clients.Group(userId.ToString()).SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Type,
                    notification.Title,
                    notification.Message,
                    notification.Severity,
                    notification.CreatedAt,
                    notification.IsRead,
                    notification.RelatedEntityId,
                    notification.ActionUrl
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erreur lors de l'envoi de notification SignalR à {userId}");
            }
        }

        /// <summary>
        /// Récupérer toutes les notifications d'un utilisateur
        /// </summary>
        public async Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
        {
            var query = _context.Notifications.Where(n => n.UserId == userId);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            return await query.OrderByDescending(n => n.CreatedAt).ToListAsync();
        }

        /// <summary>
        /// Marquer une notification comme lue
        /// </summary>
        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Notification {notificationId} marquée comme lue");
            return true;
        }

        /// <summary>
        /// Marquer toutes les notifications comme lues
        /// </summary>
        public async Task<int> MarkAllAsReadAsync(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ {notifications.Count} notifications marquées comme lues pour user {userId}");
            return notifications.Count;
        }

        /// <summary>
        /// Vérifier et notifier les budgets dépassés
        /// </summary>
        public async Task CheckBudgetAlertsAsync(int userId)
        {
            var budgets = await _context.Budgets
                .Where(b => b.UserId == userId && b.EndDate >= DateTime.Now)
                .ToListAsync();

            foreach (var budget in budgets)
            {
                // Calculer les dépenses pour ce budget
                var spent = await _context.Transactions
                    .Where(t => t.UserId == userId &&
                               t.CategoryId == budget.CategoryId &&
                               t.Type == "Dépense" &&
                               t.Date >= budget.StartDate &&
                               t.Date <= budget.EndDate)
                    .SumAsync(t => t.Amount);

                // Si dépassement > 100%, envoyer alerte
                if (spent > budget.Amount)
                {
                    var overspent = spent - budget.Amount;
                    var percentage = (spent / budget.Amount) * 100;

                    await CreateAndSendAsync(
                        userId,
                        "Budget",
                        "🚨 Budget Dépassé !",
                        $"Le budget '{budget.Name}' est dépassé de {overspent:N2} MAD ({percentage:N0}%)",
                        "error",
                        budget.Id,
                        "/budgets"
                    );
                }
                // Alerte à 80%
                else if (spent >= budget.Amount * 0.8m && spent < budget.Amount)
                {
                    var percentage = (spent / budget.Amount) * 100;

                    await CreateAndSendAsync(
                        userId,
                        "Budget",
                        "⚠️ Alerte Budget",
                        $"Le budget '{budget.Name}' est utilisé à {percentage:N0}% ({spent:N2}/{budget.Amount:N2} MAD)",
                        "warning",
                        budget.Id,
                        "/budgets"
                    );
                }
            }
        }

        /// <summary>
        /// Notifier pour une transaction importante
        /// </summary>
        public async Task NotifyImportantTransactionAsync(int userId, Transaction transaction)
        {
            // Seuil : transactions > 1000 MAD
            if (transaction.Amount > 1000)
            {
                var icon = transaction.Type == "Dépense" ? "💸" : "💰";
                var severity = transaction.Type == "Dépense" ? "warning" : "success";

                await CreateAndSendAsync(
                    userId,
                    "Transaction",
                    $"{icon} Transaction Importante",
                    $"{transaction.Type} de {transaction.Amount:N2} MAD : {transaction.Description}",
                    severity,
                    transaction.Id,
                    "/transactions"
                );
            }
        }

        /// <summary>
        /// Envoyer un rappel de paiement récurrent
        /// </summary>
        public async Task SendRecurringPaymentReminderAsync(int userId, RecurringPayment payment)
        {
            await CreateAndSendAsync(
                userId,
                "Payment",
                "📅 Rappel de Paiement",
                $"Rappel : {payment.Name} - {payment.Amount:N2} MAD à payer le {payment.DayOfMonth} du mois",
                "info",
                payment.Id,
                "/transactions"
            );

            // Mettre à jour la date de dernière notification
            payment.LastNotificationDate = DateTime.Now;
            await _context.SaveChangesAsync();
        }
    }
}
