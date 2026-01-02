using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using SuiviFinancier.Services;
using SuiviFinancier.Extensions;

namespace SuiviFinancier.BackgroundServices
{
    /// <summary>
    /// Service en arrière-plan pour vérifier les paiements récurrents
    /// S'exécute toutes les heures
    /// </summary>
    public class RecurringPaymentBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RecurringPaymentBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

        public RecurringPaymentBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<RecurringPaymentBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("📅 RecurringPaymentBackgroundService démarré");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckRecurringPaymentsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Erreur dans RecurringPaymentBackgroundService");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("📅 RecurringPaymentBackgroundService arrêté");
        }

        private async Task CheckRecurringPaymentsAsync()
        {
            using var scope = _serviceProvider.CreateScope();var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

            var today = DateTime.Now;
            var currentDay = today.Day;

            // Récupérer tous les paiements récurrents actifs pour aujourd'hui
            var payments = await context.RecurringPayments
                .Where(p => p.IsActive && p.DayOfMonth == currentDay)
                .ToListAsync();

            foreach (var payment in payments)
            {
                // Vérifier si une notification a déjà été envoyée aujourd'hui
                if (payment.LastNotificationDate.HasValue &&
                    payment.LastNotificationDate.Value.Date == today.Date)
                {
                    continue; // Déjà notifié aujourd'hui
                }

                // Envoyer la notification
                await notificationService.SendRecurringPaymentReminderAsync(
                    payment.UserId,
                    payment
                );

                _logger.LogInformation($"📅 Rappel envoyé : {payment.Name} pour user {payment.UserId}");
            }

            if (payments.Any())
            {
                _logger.LogInformation($"✅ {payments.Count} rappels de paiements vérifiés");
            }
        }
    }
}
