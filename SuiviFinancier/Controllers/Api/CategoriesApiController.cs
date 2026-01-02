using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SuiviFinancier.Models;
using SuiviFinancier.DTOs;
using System.Security.Claims;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers.Api
{
    [Route("api/categories")]
    [ApiController]
    [Authorize]
    public class CategoriesApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CategoriesApiController> _logger;

        public CategoriesApiController(AppDbContext context, ILogger<CategoriesApiController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/categories
        /// Récupérer toutes les catégories de l'utilisateur
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            var userId = User.GetUserIdInt();
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.Type,
                    c.Icon,
                    c.Color,
                    c.UserId
                })
                .ToListAsync();

            _logger.LogInformation($"📁 {categories.Count} catégorie(s) récupérée(s) pour l'utilisateur {userId}");
            return Ok(categories);
        }

        /// <summary>
        /// GET: api/categories/5
        /// Récupérer une catégorie par son ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var userId = User.GetUserIdInt();
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (category == null)
            {
                return NotFound(new { message = "Catégorie introuvable" });
            }

            return Ok(category);
        }

        /// <summary>
        /// GET: api/categories/type/Income
        /// Récupérer les catégories par type (Income ou Expense)
        /// </summary>
        [HttpGet("type/{type}")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategoriesByType(string type)
        {
            var userId = User.GetUserIdInt();
            var categories = await _context.Categories
                .Where(c => c.UserId == userId && c.Type == type)
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }

        /// <summary>
        /// POST: api/categories
        /// Créer une nouvelle catégorie
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Category>> CreateCategory([FromBody] CreateCategoryDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.GetUserIdInt();
            
            // 🔍 DEBUG: Vérifier si l'utilisateur existe dans AspNetUsers
            var userExists = await _context.Set<SuiviFinancier.Models.User>().AnyAsync(u => u.Email == User.FindFirstValue(ClaimTypes.Email));
            _logger.LogInformation($"🔍 DEBUG - UserId from token: {userId}, User exists in DB: {userExists}");
            
            if (!userExists)
            {
                _logger.LogError($"❌ UserId '{userId}' from JWT doesn't exist in AspNetUsers table!");
                return BadRequest(new { message = "Utilisateur invalide. Veuillez vous reconnecter.", userId = userId });
            }

            // Vérifier si une catégorie avec ce nom existe déjà
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == dto.Name && c.UserId == userId);

            if (existingCategory != null)
            {
                return BadRequest(new { message = "Une catégorie avec ce nom existe déjà" });
            }

            // Mapping DTO -> Entity
            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type,
                Color = dto.Color,
                Icon = dto.Icon,
                UserId = userId!
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"✅ Nouvelle catégorie créée : {category.Name} (ID: {category.Id})");
            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        /// <summary>
        /// PUT: api/categories/5
        /// Modifier une catégorie existante
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category category)
        {
            if (id != category.Id)
            {
                return BadRequest(new { message = "ID incompatible" });
            }

            var userId = User.GetUserIdInt();
            var existingCategory = await _context.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (existingCategory == null)
            {
                return NotFound(new { message = "Catégorie introuvable" });
            }

            category.UserId = userId!;
            ModelState.Remove("UserId");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Entry(category).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"✏️ Catégorie modifiée : {category.Name} (ID: {category.Id})");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Categories.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// DELETE: api/categories/5
        /// Supprimer une catégorie
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var userId = User.GetUserIdInt();
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (category == null)
            {
                return NotFound(new { message = "Catégorie introuvable" });
            }

            // Vérifier s'il y a des transactions liées
            var hasTransactions = await _context.Transactions
                .AnyAsync(t => t.CategoryId == id && t.UserId == userId);

            if (hasTransactions)
            {
                return BadRequest(new { message = "Impossible de supprimer une catégorie contenant des transactions" });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"🗑️ Catégorie supprimée : {category.Name} (ID: {category.Id})");
            return NoContent();
        }
    }
}
