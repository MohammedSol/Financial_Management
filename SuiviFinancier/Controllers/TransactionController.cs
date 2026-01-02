using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using SuiviFinancier.ML;
using System.Threading.Tasks;
using System.Linq;
using System.Text;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using System.Security.Claims;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Controllers
{
    public class TransactionController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly CategoryPredictorService _predictorService;

        public TransactionController(AppDbContext context, IWebHostEnvironment hostEnvironment, CategoryPredictorService predictorService)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
            _predictorService = predictorService;
        }

        // --- LISTE ---
        public async Task<IActionResult> Index()
        {
            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            
            // On inclut Category et Account pour pouvoir afficher leurs noms dans le tableau
            // FILTRAGE PAR USERID pour l'isolation des données
            var transactions = _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Date); // Trie par date décroissante (plus récent en haut)

            return View(await transactions.ToListAsync());
        }

        // --- CRÉER ---
        public IActionResult Create()
        {
            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();
            
            // On prépare les listes déroulantes FILTRÉES par UserId
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userId).ToList(), 
                "Id", "Name");
            ViewData["AccountId"] = new SelectList(
                _context.Accounts.Where(a => a.UserId == userId).ToList(), 
                "Id", "Name");
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Description,Amount,Date,Type,CategoryId,AccountId")] Transaction transaction)
        {
            // Retirer UserId de la validation car on l'attribue manuellement
            ModelState.Remove("UserId");
            
            if (ModelState.IsValid)
            {
                // --- LOGIQUE D'UPLOAD DE FICHIER (DÉSACTIVÉE TEMPORAIREMENT) ---
                /* 
                if (transaction.ReceiptFile != null)
                {
                    string wwwRootPath = _hostEnvironment.WebRootPath;
                    string fileName = Path.GetFileNameWithoutExtension(transaction.ReceiptFile.FileName);
                    string extension = Path.GetExtension(transaction.ReceiptFile.FileName);
                    fileName = fileName + DateTime.Now.ToString("yymmssfff") + extension;
                    string path = Path.Combine(wwwRootPath + "/uploads/");
                    if (!Directory.Exists(path)) Directory.CreateDirectory(path);
                    string fullPath = Path.Combine(path + fileName);
                    using (var fileStream = new FileStream(fullPath, FileMode.Create))
                    {
                        await transaction.ReceiptFile.CopyToAsync(fileStream);
                    using SuiviFinancier.Extensions;
}
                    transaction.ReceiptPath = "/uploads/" + fileName;
                }
                */
                // ------------------------------------

                // Attribuer l'UserId de l'utilisateur connecté
                transaction.UserId = User.GetUserIdInt();

                // 1. On enregistre la transaction (Comme avant)
                _context.Add(transaction);

                // --- DEBUT DU NOUVEAU CODE (LOGIQUE DE CALCUL) ---

                // 2. On va chercher le Compte et la Catégorie concernés dans la base
                var account = await _context.Accounts.FindAsync(transaction.AccountId);
                var category = await _context.Categories.FindAsync(transaction.CategoryId);

                // 3. On vérifie si tout existe bien
                if (account != null && category != null)
                {
                    // 4. On met à jour le solde selon le type
                    if (category.Type == "Depense")
                    {
                        // Si c'est une dépense, on retire de l'argent
                        account.Balance -= transaction.Amount; 
                    }
                    else if (category.Type == "Revenu")
                    {
                        // Si c'est un revenu, on ajoute de l'argent
                        account.Balance += transaction.Amount;
                    }

                    // 5. On dit à la base de données que le compte a été modifié
                    _context.Update(account);
                }
                // --- FIN DU NOUVEAU CODE ---

                // 6. On sauvegarde TOUT (la transaction ET le nouveau solde du compte)
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            
            // Si le formulaire est invalide, on recharge les listes FILTRÉES
            var userId = User.GetUserIdInt();
            
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userId).ToList(), 
                "Id", "Name", transaction.CategoryId);
            ViewData["AccountId"] = new SelectList(
                _context.Accounts.Where(a => a.UserId == userId).ToList(), 
                "Id", "Name", transaction.AccountId);
            return View(transaction);
        }

        // --- MODIFIER ---
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null) return NotFound();

            // Récupérer l'UserId de l'utilisateur connecté
            var userId = User.GetUserIdInt();

            // FILTRER les listes déroulantes par UserId
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userId).ToList(), 
                "Id", "Name", transaction.CategoryId);
            ViewData["AccountId"] = new SelectList(
                _context.Accounts.Where(a => a.UserId == userId).ToList(), 
                "Id", "Name", transaction.AccountId);
            return View(transaction);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Description,Amount,Date,Type,CategoryId,AccountId")] Transaction transaction)
        {
            if (id != transaction.Id) return NotFound();

            // Retirer UserId de la validation car on le préserve de la transaction existante
            ModelState.Remove("UserId");

            if (ModelState.IsValid)
            {
                try
                {
                    // Récupérer la transaction existante pour préserver l'UserId
                    var existingTransaction = await _context.Transactions.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
                    if (existingTransaction != null)
                    {
                        transaction.UserId = existingTransaction.UserId;
                    }
                    
                    _context.Update(transaction);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!_context.Transactions.Any(e => e.Id == transaction.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            
            // Si le formulaire est invalide, recharger les listes FILTRÉES
            var userIdForEdit = User.GetUserIdInt();
            
            ViewData["CategoryId"] = new SelectList(
                _context.Categories.Where(c => c.UserId == userIdForEdit).ToList(), 
                "Id", "Name", transaction.CategoryId);
            ViewData["AccountId"] = new SelectList(
                _context.Accounts.Where(a => a.UserId == userIdForEdit).ToList(), 
                "Id", "Name", transaction.AccountId);
            return View(transaction);
        }

        // --- SUPPRIMER ---
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var transaction = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (transaction == null) return NotFound();

            return View(transaction);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction != null)
            {
                _context.Transactions.Remove(transaction);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        // --- EXPORT CSV ---
        public async Task<IActionResult> Export()
        {
            // 1. Récupérer toutes les transactions
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Include(t => t.Account)
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            // 2. Créer le contenu du fichier (StringBuilder est très rapide pour ça)
            var builder = new StringBuilder();

            // 3. Ajouter la ligne d'en-tête (Les titres des colonnes)
            // On utilise le point-virgule ";" pour la compatibilité Excel FR
            builder.AppendLine("Date;Description;Catégorie;Compte;Type;Montant");

            // 4. Parcourir les données et ajouter les lignes
            foreach (var t in transactions)
            {
                // On prépare les données (gestion des nulls avec "?")
                var date = t.Date.ToShortDateString();
                var description = t.Description?.Replace(";", ",").Replace("\r", " ").Replace("\n", " ") ?? "";
                var categorie = t.Category?.Name ?? "Aucune";
                var compte = t.Account?.Name ?? "Aucun";
                var type = t.Category?.Type ?? "N/A";
                
                // Pour le montant : positif si revenu, négatif si dépense
                // On force le format numérique français (avec virgule)
                decimal montantReel = t.Amount;
                if (type == "Depense") montantReel = -t.Amount;
                else if (type == "Revenu") montantReel = t.Amount;

                // On écrit la ligne
                builder.AppendLine($"{date};{description};{categorie};{compte};{type};{montantReel}");
            }

            // 5. Renvoyer le fichier au navigateur
            // L'encodage UTF-8 avec Preamble permet à Excel de reconnaître les accents
            return File(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(builder.ToString())).ToArray(), 
                        "text/csv", 
                        $"Transactions_{DateTime.Now:yyyyMMdd_HHmm}.csv");
        }

        // --- API DE SUGGESTION DE CATÉGORIE ---
        [HttpGet]
        public IActionResult SuggestCategory(string title)
        {
            if (string.IsNullOrEmpty(title))
            {
                return Json(new { success = false, message = "Titre vide." });
            }

            try
            {
                // Essayer de charger et utiliser le modèle
                string predictedCategoryName = _predictorService.PredictCategory(title);

                return Json(new { 
                    success = true, 
                    suggestedCategory = predictedCategoryName 
                });
            }
            catch (FileNotFoundException)
            {
                return Json(new { success = false, message = "Le modèle ML n'a pas encore été entraîné." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Erreur du moteur de prédiction: " + ex.Message });
            }
        }
    }
}
