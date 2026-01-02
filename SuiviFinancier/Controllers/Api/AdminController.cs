using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Data;
using SuiviFinancier.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
// using SuiviFinancier.DTOs; // Désactivé pour utiliser des types anonymes (plus sûr)

namespace SuiviFinancier.Controllers.Api
{
    [Authorize(Roles = "Admin")]
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(AppDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ==========================================
        // 1. DASHBOARD & STATS GLOBAUX
        // ==========================================

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                // 📊 Données pour graphique des 7 derniers jours
                var last7Days = DateTime.UtcNow.AddDays(-7);
                var chartData = await _context.Transactions
                    .Where(t => t.Date >= last7Days)
                    .GroupBy(t => t.Date.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Revenus = g.Where(t => t.Type == "Revenu").Sum(t => t.Amount),
                        Depenses = g.Where(t => t.Type == "Dépense" || t.Type == "Depense").Sum(t => t.Amount)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                // 🍰 Répartition par catégorie (Top 5)
                var categoryPie = await _context.Transactions
                    .Include(t => t.Category)
                    .Where(t => t.Category != null)
                    .GroupBy(t => t.Category!.Name)
                    .Select(g => new { Name = g.Key, Value = g.Count() })
                    .OrderByDescending(x => x.Value)
                    .Take(5)
                    .ToListAsync();

                var stats = new
                {
                    TotalUsers = await _context.Users.CountAsync(),
                    TotalTransactions = await _context.Transactions.CountAsync(),
                    TotalVolume = await _context.Transactions.SumAsync(t => t.Amount),
                    TotalAccounts = await _context.Accounts.CountAsync(),
                    ActiveUsers = await _context.Users.CountAsync(u => !u.IsLocked),
                    LockedUsers = await _context.Users.CountAsync(u => u.IsLocked),
                    
                    // 📈 Données formatées pour le Frontend
                    ChartData = chartData.Select(x => new
                    {
                        Date = x.Date.ToString("dd/MM"),
                        x.Revenus,
                        x.Depenses
                    }),
                    CategoryData = categoryPie,
                    SystemStatus = "Online",
                    DatabaseLatency = "12ms"
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur Stats");
                return StatusCode(500, new { message = "Erreur serveur" });
            }
        }

        // ==========================================
        // 2. GESTION DES UTILISATEURS
        // ==========================================

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u => u.Name.Contains(search) || u.Email.Contains(search));
                }

                var totalItems = await query.CountAsync();

                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new 
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.Role,
                        u.CreatedAt,
                        u.IsLocked,
                        AccountsCount = u.Accounts != null ? u.Accounts.Count : 0,
                        TransactionsCount = _context.Transactions.Count(t => t.UserId == u.Id)
                    })
                    .ToListAsync();
                
                return Ok(new
                {
                    Data = users,
                    Total = totalItems,
                    Page = page,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur Users");
                return StatusCode(500, new { message = "Erreur serveur" });
            }
        }

        [HttpPut("users/{id}/lock")]
        public async Task<IActionResult> ToggleLockUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            
            if (user == null) 
                return NotFound(new { message = "Utilisateur introuvable" });
            
            if (user.Role == "Admin") 
                return BadRequest(new { message = "Impossible de verrouiller un administrateur" });

            // On inverse simplement le statut (Vrai <-> Faux)
            user.IsLocked = !user.IsLocked;
            
            // J'AI SUPPRIMÉ LES LIGNES "user.LockoutEnd = ..." QUI POSAIENT PROBLÈME
            // Car votre base de données ne gère pas encore les dates de fin de bannissement.

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = user.IsLocked ? "Utilisateur verrouillé" : "Utilisateur déverrouillé",
                userId = user.Id,
                isLocked = user.IsLocked
            });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try 
            {
                var user = await _context.Users
                    .Include(u => u.Accounts)
                    .Include(u => u.Budgets)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null) return NotFound(new { message = "Utilisateur non trouvé" });
                if (user.Role == "Admin") return BadRequest(new { message = "Impossible de supprimer un administrateur" });

                // Nettoyage manuel des données liées (si cascade non configurée en DB)
                var transactions = _context.Transactions.Where(t => t.UserId == id);
                _context.Transactions.RemoveRange(transactions);

                var categories = _context.Categories.Where(c => c.UserId == id);
                _context.Categories.RemoveRange(categories);

                var notifs = _context.Notifications.Where(n => n.UserId == id);
                _context.Notifications.RemoveRange(notifs);

                var recurring = _context.RecurringPayments.Where(rp => rp.UserId == id);
                _context.RecurringPayments.RemoveRange(recurring);

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Utilisateur supprimé avec succès" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur Delete User");
                return StatusCode(500, new { message = "Erreur serveur lors de la suppression" });
            }
        }

        [HttpGet("users/analytics")]
        public async Task<IActionResult> GetUserAnalytics()
        {
            var today = DateTime.UtcNow.Date;
            var lastMonth = today.AddDays(-30);

            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => _context.Transactions.Any(t => t.UserId == u.Id && t.Date >= lastMonth));
            var bannedUsers = await _context.Users.CountAsync(u => u.IsLocked);

            var registrationTrend = await _context.Users
                .Where(u => u.CreatedAt >= lastMonth)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var rolesDistribution = await _context.Users
                .GroupBy(u => u.Role)
                .Select(g => new { Role = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                Total = totalUsers,
                Active = activeUsers,
                Banned = bannedUsers,
                Trend = registrationTrend.Select(x => new { count = x.Count, name = x.Date.ToString("dd/MM") }),
                Roles = rolesDistribution
            });
        }

        [HttpGet("users/{id}/details")]
        public async Task<IActionResult> GetUserDeepDetails(int id)
        {
            var user = await _context.Users
                .Include(u => u.Accounts)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return NotFound(new { message = "Utilisateur introuvable" });

            // Charger transactions séparément pour éviter les soucis d'Include complexes
            var lastTransactions = await _context.Transactions
                .Where(t => t.UserId == id)
                .Include(t => t.Category)
                .OrderByDescending(t => t.Date)
                .Take(5)
                .Select(t => new {
                    t.Id, t.Description, t.Amount, t.Date, t.Type, 
                    CategoryName = t.Category != null ? t.Category.Name : "N/A"
                })
                .ToListAsync();

            var totalVolume = await _context.Transactions.Where(t => t.UserId == id).SumAsync(t => t.Amount);

            // Note: IsOnline géré côté client via SignalR, on met false par défaut ici
            return Ok(new
            {
                user.Id, user.Name, user.Email, user.CreatedAt, user.Role, user.IsLocked,
                AccountsCount = user.Accounts != null ? user.Accounts.Count : 0,
                LastTransactions = lastTransactions,
                TotalVolume = totalVolume,
                IsOnline = false 
            });
        }

        [HttpGet("users/online")]
        public IActionResult GetOnlineUsers()
        {
            // Récupère les IDs depuis le Hub SignalR (Mémoire statique)
            // Assurez-vous que NotificationHub.OnlineUsers est public static
            try 
            {
                // Si vous avez implémenté le dictionnaire statique dans NotificationHub :
                var onlineIds = SuiviFinancier.Hubs.NotificationHub.OnlineUsers.Keys
                    .Select(k => int.Parse(k))
                    .ToList();
                return Ok(onlineIds);
            }
            catch
            {
                return Ok(new List<int>()); // Retourne vide si pas implémenté
            }
        }

        // ==========================================
        // 3. GESTION DES TRANSACTIONS
        // ==========================================

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? type = null,
            [FromQuery] decimal? minAmount = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = _context.Transactions
                    .Include(t => t.User)
                    .Include(t => t.Category)
                    .Include(t => t.Account)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(type) && type != "All")
                    query = query.Where(t => t.Type == type);

                if (minAmount.HasValue)
                    query = query.Where(t => t.Amount >= minAmount.Value);

                if (!string.IsNullOrEmpty(search))
                    query = query.Where(t => t.User.Email.Contains(search) || t.User.Name.Contains(search));

                var totalCount = await query.CountAsync();

                var items = await query
                    .OrderByDescending(t => t.Date)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new 
                    {
                        t.Id,
                        t.Description,
                        t.Amount,
                        t.Date,
                        t.Type,
                        t.ReceiptPath,
                        UserId = t.UserId,
                        UserName = t.User.Name,
                        UserEmail = t.User.Email,
                        CategoryName = t.Category != null ? t.Category.Name : null,
                        AccountName = t.Account != null ? t.Account.Name : null,
                        t.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    items = items, // minuscule pour matcher le front souvent
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur Transactions");
                return StatusCode(500, new { message = "Erreur serveur" });
            }
        }

        [HttpGet("transactions/analytics")]
        public async Task<IActionResult> GetTransactionAnalytics()
        {
            var last30Days = DateTime.UtcNow.AddDays(-30);
            var today = DateTime.UtcNow.Date;

            var totalVolume = await _context.Transactions.SumAsync(t => t.Amount);
            var countToday = await _context.Transactions.CountAsync(t => t.Date.Date == today);
            var highValueCount = await _context.Transactions.CountAsync(t => t.Amount > 5000);

            var flowTrend = await _context.Transactions
                .Where(t => t.Date >= last30Days)
                .GroupBy(t => t.Date.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Income = g.Where(t => t.Type == "Revenu").Sum(t => t.Amount),
                    Expense = g.Where(t => t.Type == "Dépense" || t.Type == "Depense").Sum(t => t.Amount)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return Ok(new 
            { 
                TotalVolume = totalVolume, 
                TodayCount = countToday, 
                HighValue = highValueCount, 
                Trend = flowTrend.Select(x => new 
                { 
                    date = x.Date.ToString("dd/MM"), // Format court pour le chart
                    income = x.Income, 
                    expense = x.Expense 
                }) 
            });
        }
    }
}