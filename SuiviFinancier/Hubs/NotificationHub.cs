using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SuiviFinancier.Hubs
{
    /// <summary>
    /// Hub SignalR pour les notifications en temps réel
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;
        
        // Dictionnaire statique pour suivre les utilisateurs en ligne (ID utilisateur -> ConnectionId)
        public static readonly Dictionary<string, string> OnlineUsers = new();

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Appelé quand un client se connecte
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var userEmail = Context.User?.FindFirstValue(ClaimTypes.Email);
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Ajouter l'utilisateur à son groupe personnel
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);
                
                // Marquer l'utilisateur comme en ligne
                lock (OnlineUsers)
                {
                    OnlineUsers[userId] = Context.ConnectionId;
                }
                
                // Notifier tous les admins qu'un utilisateur est en ligne
                await Clients.All.SendAsync("UserStatusChanged", int.Parse(userId), true);
                
                _logger.LogInformation($"🔔 {userEmail} connecté au NotificationHub (ConnectionId: {Context.ConnectionId})");
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Appelé quand un client se déconnecte
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var userEmail = Context.User?.FindFirstValue(ClaimTypes.Email);
            
            if (!string.IsNullOrEmpty(userId))
            {
                // Retirer l'utilisateur de la liste en ligne
                lock (OnlineUsers)
                {
                    OnlineUsers.Remove(userId);
                }
                
                // Notifier tous les admins qu'un utilisateur est hors ligne
                await Clients.All.SendAsync("UserStatusChanged", int.Parse(userId), false);
            }
            
            _logger.LogInformation($"🔕 {userEmail} déconnecté du NotificationHub");
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Marquer une notification comme lue (appelé depuis le client)
        /// </summary>
        public async Task MarkAsRead(int notificationId)
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"📖 Notification {notificationId} marquée comme lue par {userId}");
            
            // La mise à jour en base sera faite par l'API REST
            await Task.CompletedTask;
        }
    }
}
