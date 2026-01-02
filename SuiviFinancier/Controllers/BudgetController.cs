using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Claims;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers
{
    // ViewModel pour enrichir les données du Budget
    public class BudgetViewModel
    {
        public int Id { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryIcon { get; set; } = string.Empty; // Pour le visuel
        public string CategoryColor { get; set; } = string.Empty;
        public decimal LimitAmount { get; set; }
        public decimal SpentAmount { get; set; }
        
        public decimal RemainingAmount => LimitAmount - SpentAmount;
        public int Percentage => LimitAmount == 0 ? 0 : (int)((SpentAmount / LimitAmount) * 100);
    }

    public class BudgetController : Controller
    {
        private readonly AppDbContext _context;

        public BudgetController(AppDbContext context)
        {
            _context = context;
        }

        // --- LISTE ---
        public async Task<IActionResult> Index()
        {
            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            
            // 1. Définir la période (Ce mois-ci)
            var startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            
            // 2. Récupérer tous les budgets de l'utilisateur UNIQUEMENT
            var budgets = await _context.Budgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId)
                .ToListAsync();
            
            // 3. Récupérer toutes les dépenses du mois pour les catégories de l'utilisateur
            var categoryIds = budgets.Select(b => b.CategoryId).ToList();
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.Date >= startDate && t.Date <= endDate && categoryIds.Contains(t.CategoryId))
                .ToListAsync();

            // 4. Construire la liste enrichie
            var budgetList = new List<BudgetViewModel>();

            foreach (var b in budgets)
            {
                // Somme des dépenses pour CETTE catégorie (filtrer par Type Depense)
                var spent = transactions
                    .Where(t => t.CategoryId == b.CategoryId && t.Category != null && t.Category.Type == "Depense")
                    .Sum(t => t.Amount);

                budgetList.Add(new BudgetViewModel
                {
                    Id = b.Id,
                    CategoryName = b.Category?.Name ?? "Sans catégorie",
                    CategoryIcon = b.Category?.Icon ?? "bi-tag",
                    CategoryColor = b.Category?.Color ?? "#6c757d",
                    LimitAmount = b.Amount,
                    SpentAmount = spent
                });
            }

            // 5. Trier par "Urgence" (Ceux qui sont le plus proche de la limite en premier)
            return View(budgetList.OrderByDescending(b => b.Percentage));
        }

        // --- CRÉER ---
        public IActionResult Create()
        {
            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            
            // FILTRER les catégories par UserId
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userId).ToList(), 
                "Id", "Name");
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Name,Amount,StartDate,EndDate,CategoryId")] Budget budget)
        {
            // Attribuer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            budget.UserId = userId;
            
            // Retirer UserId de la validation ModelState car il est défini programmatiquement
            ModelState.Remove("UserId");
            
            if (ModelState.IsValid)
            {
                
                budget.CreatedAt = DateTime.Now;
                _context.Add(budget);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            
            // Si le formulaire est invalide, recharger les catégories FILTRÉES
            var userIdForCreate = User.GetUserIdInt();
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userIdForCreate).ToList(), 
                "Id", "Name", budget.CategoryId);
            return View(budget);
        }

        // --- MODIFIER ---
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var budget = await _context.Budgets.FindAsync(id);
            if (budget == null) return NotFound();

            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            
            // FILTRER les catégories par UserId
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userId).ToList(), 
                "Id", "Name", budget.CategoryId);
            return View(budget);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Name,Amount,StartDate,EndDate,CategoryId")] Budget budget)
        {
            if (id != budget.Id) return NotFound();

            // Préserver l'UserId du budget existant
            var existingBudget = await _context.Budgets.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
            if (existingBudget != null)
            {
                budget.UserId = existingBudget.UserId;
            }
            
            // Retirer UserId de la validation ModelState car il est défini programmatiquement
            ModelState.Remove("UserId");

            if (ModelState.IsValid)
            {
                try
                {
                    budget.CreatedAt = DateTime.Now;
                    _context.Update(budget);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Budgets.Any(e => e.Id == budget.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            
            // Si le formulaire est invalide, recharger les catégories FILTRÉES
            var userIdForEdit = User.GetUserIdInt();
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userIdForEdit).ToList(), 
                "Id", "Name", budget.CategoryId);
            return View(budget);
        }

        // --- SUPPRIMER ---
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var budget = await _context.Budgets
                .Include(b => b.Category)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (budget == null) return NotFound();

            return View(budget);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var budget = await _context.Budgets.FindAsync(id);
            if (budget != null)
            {
                _context.Budgets.Remove(budget);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
