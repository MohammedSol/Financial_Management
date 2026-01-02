using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.DTOs;
using SuiviFinancier.Services;
using SuiviFinancier.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SuiviFinancier.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly TokenService _tokenService;
        private readonly ILogger<AuthController> _logger;
        private readonly AppDbContext _context;

        public AuthController(
            UserManager<IdentityUser> userManager,
            IConfiguration configuration,
            TokenService tokenService,
            ILogger<AuthController> logger,
            AppDbContext context)
        {
            _userManager = userManager;
            _configuration = configuration;
            _tokenService = tokenService;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Inscription d'un nouvel utilisateur
        /// POST: api/auth/register
        /// </summary>
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
            {
                return BadRequest(new { message = "Cet email est déjà utilisé" });
            }

            var user = new IdentityUser
            {
                UserName = model.Email,
                Email = model.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Créer aussi l'utilisateur dans la table Users personnalisée avec rôle par défaut
                var customUser = new User
                {
                    Name = model.Email.Split('@')[0],
                    Email = model.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
                    Role = "User", // Rôle par défaut
                    CreatedAt = DateTime.Now
                };
                
                _context.Users.Add(customUser);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"✅ Nouvel utilisateur créé : {user.Email}");
                return Ok(new { message = "Utilisateur créé avec succès", userId = user.Id });
            }

            // ✅ CORRECTION : Renvoyer un message uniforme au lieu d'un tableau
            var errorMessages = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogError($"❌ Échec inscription : {errorMessages}");
            return BadRequest(new { message = errorMessages });
        }

        /// <summary>
        /// Connexion d'un utilisateur
        /// POST: api/auth/login
        /// </summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                _logger.LogWarning($"❌ Tentative de connexion échouée pour : {model.Email}");
                return Unauthorized(new { message = "Email ou mot de passe invalide" });
            }

            // Générer le token JWT
            var token = GenerateJwtToken(user);
            var expireMinutes = Convert.ToDouble(_configuration["Jwt:ExpireMinutes"]);
            var expiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);

            // Sauvegarder le token dans Redis
            await _tokenService.SaveTokenAsync(token, user.Id, TimeSpan.FromMinutes(expireMinutes));

            _logger.LogInformation($"✅ Utilisateur connecté : {user.Email}");

            // Récupérer le rôle depuis la base de données
            var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == user.Email);
            var userRole = dbUser?.Role ?? "User";

            return Ok(new AuthResponseDTO
            {
                Token = token,
                Email = user.Email!,
                UserId = user.Id,
                Role = userRole,
                ExpiresAt = expiresAt
            });
        }

        /// <summary>
        /// Déconnexion (révocation du token)
        /// POST: api/auth/logout
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { message = "Token manquant" });
            }

            await _tokenService.RevokeTokenAsync(token);
            _logger.LogInformation("🔒 Utilisateur déconnecté");

            return Ok(new { message = "Déconnexion réussie" });
        }

        /// <summary>
        /// Vérifier si un token est valide
        /// GET: api/auth/validate
        /// </summary>
        [HttpGet("validate")]
        public async Task<IActionResult> ValidateToken()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new { message = "Token manquant", isValid = false });
            }

            var isValid = await _tokenService.IsTokenValidAsync(token);
            
            if (isValid)
            {
                var userId = await _tokenService.GetUserIdFromTokenAsync(token);
                return Ok(new { isValid = true, userId });
            }

            return Unauthorized(new { message = "Token invalide ou expiré", isValid = false });
        }

        /// <summary>
        /// Obtenir les statistiques des tokens (pour admin/debug)
        /// GET: api/auth/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var activeTokens = await _tokenService.GetActiveTokensCountAsync();
            return Ok(new { activeTokensCount = activeTokens });
        }

        /// <summary>
        /// DEBUG: Lister tous les utilisateurs en base
        /// GET: api/auth/debug-users
        /// </summary>
        [HttpGet("debug-users")]
        public async Task<IActionResult> DebugUsers()
        {
            var users = await _userManager.Users
                .Select(u => new { u.Id, u.Email, u.UserName })
                .ToListAsync();
            
            _logger.LogInformation($"🔍 DEBUG - Total users in database: {users.Count}");
            return Ok(users);
        }

        /// <summary>
        /// Générer un token JWT
        /// </summary>
        private string GenerateJwtToken(IdentityUser user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // ✅ Récupérer l'ID entier depuis la table Users personnalisée
            var dbUser = _context.Users.FirstOrDefault(u => u.Email == user.Email);
            
            // ✅ Si l'utilisateur n'existe pas dans la table Users, le créer automatiquement (migration)
            if (dbUser == null)
            {
                _logger.LogWarning($"⚠️ Migration : Utilisateur {user.Email} existe dans Identity mais pas dans Users. Création automatique...");
                
                dbUser = new User
                {
                    Name = user.Email!.Split('@')[0],
                    Email = user.Email!,
                    Password = "***", // Mot de passe géré par Identity
                    Role = "User", // Rôle par défaut
                    CreatedAt = DateTime.Now
                };
                
                _context.Users.Add(dbUser);
                _context.SaveChanges();
                
                _logger.LogInformation($"✅ Utilisateur {user.Email} créé dans la table Users avec ID={dbUser.Id}");
            }

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, dbUser.Id.ToString()),  // ✅ ID int de Users
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email!),
                // ✅ ClaimTypes.NameIdentifier = ID INT (recommandation standard)
                new Claim(ClaimTypes.NameIdentifier, dbUser.Id.ToString()),  // ID int converti en string
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Role, dbUser.Role)  // ✅ Ajouter le rôle dans les claims
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpireMinutes"])),
                signingCredentials: creds
            );

            _logger.LogInformation($"✅ Token généré pour utilisateur ID={dbUser.Id}, Email={user.Email}, Role={dbUser.Role}");
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
