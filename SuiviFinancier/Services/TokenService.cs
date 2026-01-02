using StackExchange.Redis;

namespace SuiviFinancier.Services
{
    public class TokenService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _redisDb;
        private readonly ILogger<TokenService> _logger;

        public TokenService(IConnectionMultiplexer redis, ILogger<TokenService> logger)
        {
            _redis = redis;
            _redisDb = redis.GetDatabase();
            _logger = logger;
        }

        /// <summary>
        /// Sauvegarder un token dans Redis
        /// </summary>
        public async Task SaveTokenAsync(string token, string userId, TimeSpan expiration)
        {
            try
            {
                var key = $"token:{token}";
                await _redisDb.StringSetAsync(key, userId, expiration);
                _logger.LogInformation($"✅ Token sauvegardé dans Redis pour l'utilisateur {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de la sauvegarde du token dans Redis");
                throw;
            }
        }

        /// <summary>
        /// Vérifier si un token est valide (existe dans Redis)
        /// </summary>
        public async Task<bool> IsTokenValidAsync(string token)
        {
            try
            {
                var key = $"token:{token}";
                var userId = await _redisDb.StringGetAsync(key);
                return !userId.IsNullOrEmpty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de la vérification du token dans Redis");
                return false;
            }
        }

        /// <summary>
        /// Récupérer le userId associé à un token
        /// </summary>
        public async Task<string?> GetUserIdFromTokenAsync(string token)
        {
            try
            {
                var key = $"token:{token}";
                var userId = await _redisDb.StringGetAsync(key);
                return userId.HasValue ? userId.ToString() : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de la récupération du userId depuis Redis");
                return null;
            }
        }

        /// <summary>
        /// Révoquer un token (logout)
        /// </summary>
        public async Task RevokeTokenAsync(string token)
        {
            try
            {
                var key = $"token:{token}";
                await _redisDb.KeyDeleteAsync(key);
                _logger.LogInformation($"🔒 Token révoqué : {token.Substring(0, Math.Min(10, token.Length))}...");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de la révocation du token");
                throw;
            }
        }

        /// <summary>
        /// Révoquer tous les tokens d'un utilisateur
        /// </summary>
        public async Task RevokeAllUserTokensAsync(string userId)
        {
            try
            {
                var server = _redis.GetServer(_redis.GetEndPoints()[0]);
                var keys = server.Keys(pattern: "token:*").ToList();

                int revokedCount = 0;
                foreach (var key in keys)
                {
                    var storedUserId = await _redisDb.StringGetAsync(key);
                    if (storedUserId == userId)
                    {
                        await _redisDb.KeyDeleteAsync(key);
                        revokedCount++;
                    }
                }

                _logger.LogInformation($"🔒 {revokedCount} token(s) révoqué(s) pour l'utilisateur {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de la révocation de tous les tokens");
                throw;
            }
        }

        /// <summary>
        /// Obtenir le nombre de tokens actifs
        /// </summary>
        public async Task<int> GetActiveTokensCountAsync()
        {
            try
            {
                var server = _redis.GetServer(_redis.GetEndPoints()[0]);
                var keys = server.Keys(pattern: "token:*").ToList();
                return keys.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors du comptage des tokens actifs");
                return 0;
            }
        }
    }
}
