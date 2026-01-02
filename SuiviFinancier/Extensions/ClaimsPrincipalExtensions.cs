using System.Security.Claims;

namespace SuiviFinancier.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Récupère l'ID utilisateur (int) depuis les claims de manière sécurisée
        /// Utilise ClaimTypes.NameIdentifier (standard) au lieu d'une claim custom
        /// </summary>
        public static int GetUserIdInt(this ClaimsPrincipal principal)
        {
            // ✅ Récupérer l'ID depuis ClaimTypes.NameIdentifier (standard)
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // ✅ Vérification 1 : Claim existe ?
            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new UnauthorizedAccessException("ID utilisateur manquant dans le token. Veuillez vous reconnecter.");
            }

            // ✅ Vérification 2 : Conversion en int réussie ?
            if (!int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException($"ID utilisateur invalide ou token corrompu (valeur: {userIdClaim}). Veuillez vous reconnecter.");
            }

            // ✅ Vérification 3 : ID valide (> 0) ?
            if (userId <= 0)
            {
                throw new UnauthorizedAccessException("ID utilisateur invalide (doit être > 0). Veuillez vous reconnecter.");
            }

            return userId;
        }

        /// <summary>
        /// Récupère l'ID IdentityUser (string) depuis les claims
        /// </summary>
        public static string GetIdentityUserId(this ClaimsPrincipal principal)
        {
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                throw new InvalidOperationException("NameIdentifier claim not found in token");
            }

            return userId;
        }

        /// <summary>
        /// Récupère l'email depuis les claims
        /// </summary>
        public static string GetUserEmail(this ClaimsPrincipal principal)
        {
            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            
            if (string.IsNullOrEmpty(email))
            {
                throw new InvalidOperationException("Email claim not found in token");
            }

            return email;
        }

        /// <summary>
        /// Récupère l'ID utilisateur (int) depuis les claims - Version simple qui retourne 0 si échec
        /// Utilise ClaimTypes.NameIdentifier
        /// </summary>
        public static int GetUserId(this ClaimsPrincipal principal)
        {
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return 0;
            }

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return 0;
            }

            return userId;
        }

        /// <summary>
        /// Récupère le rôle de l'utilisateur depuis les claims
        /// Retourne "User" par défaut si le claim Role n'existe pas
        /// </summary>
        public static string GetUserRole(this ClaimsPrincipal principal)
        {
            var role = principal.FindFirst(ClaimTypes.Role)?.Value;
            
            return string.IsNullOrEmpty(role) ? "User" : role;
        }
    }
}
