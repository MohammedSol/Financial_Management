using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers
{
    public class CategoryController : Controller
    {
        private readonly AppDbContext _context;

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        // --- LISTE (Index) ---
        public async Task<IActionResult> Index()
        {
            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            
            // FILTRAGE PAR USERID pour l'isolation des données
            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .ToListAsync();
                
            return View(categories);
        }

        // --- CRÉER (Create) ---
        // GET: Affiche le formulaire
        public IActionResult Create()
        {
            return View();
        }

        // POST: Reçoit les données du formulaire
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Name,Type,Description,Icon,Color")] Category category)
        {
            // Retirer UserId de la validation car on l'attribue manuellement
            ModelState.Remove("UserId");
            
            if (ModelState.IsValid)
            {
                // Attribuer l'UserId de l'utilisateur connecté
                category.UserId = User.GetUserIdInt();
                
                _context.Add(category);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(category);
        }

        // --- MODIFIER (Edit) ---
        // GET: Affiche le formulaire pré-rempli
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            return View(category);
        }

        // POST: Enregistre les modifications
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Name,Type,Description,Icon,Color")] Category category)
        {
            if (id != category.Id) return NotFound();

            // Retirer UserId de la validation car on le préserve de la catégorie existante
            ModelState.Remove("UserId");

            if (ModelState.IsValid)
            {
                try
                {
                    // Récupérer la catégorie existante pour préserver l'UserId
                    var existingCategory = await _context.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
                    if (existingCategory != null)
                    {
                        category.UserId = existingCategory.UserId;
                    }
                    
                    _context.Update(category);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Categories.Any(e => e.Id == category.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(category);
        }

        // --- SUPPRIMER (Delete) ---
        // GET: Demande confirmation
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var category = await _context.Categories
                .FirstOrDefaultAsync(m => m.Id == id);
            if (category == null) return NotFound();

            return View(category);
        }

        // POST: Confirme la suppression réelle
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category != null)
            {
                // Mettre à NULL le CategoryId de toutes les transactions associées
                var transactions = await _context.Transactions
                    .Where(t => t.CategoryId == id)
                    .ToListAsync();
                foreach (var transaction in transactions)
                {
                    transaction.CategoryId = null;
                }

                // Mettre à NULL le CategoryId de tous les budgets associés
                var budgets = await _context.Budgets
                    .Where(b => b.CategoryId == id)
                    .ToListAsync();
                foreach (var budget in budgets)
                {
                    budget.CategoryId = null;
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
