using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;

using SuiviFinancier.Extensions;
namespace SuiviFinancier.Data
{
    public class DbSeeder
    {
        public static async Task SeedMohammedUser(AppDbContext context, UserManager<IdentityUser> userManager)
        {
            var mohammedEmail = "mohammed@emsi.ma";
            var mohammedPassword = "Admin@123";

            // Vérifier si mohammed existe déjà dans la table custom Users
            var existingCustomUser = await context.Users.FirstOrDefaultAsync(u => u.Email == mohammedEmail);
            int mohammedId;
            
            if (existingCustomUser == null)
            {
                Console.WriteLine("🔄 Création de l'utilisateur mohammed...");
                
                // Créer l'IdentityUser mohammed
                var identityUser = new IdentityUser
                {
                    UserName = mohammedEmail,
                    Email = mohammedEmail,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(identityUser, mohammedPassword);
                
                if (result.Succeeded)
                {
                    // Créer le custom User avec Role=Admin
                    var customUser = new User
                    {
                        Name = "Mohammed",
                        Email = mohammedEmail,
                        Password = BCrypt.Net.BCrypt.HashPassword(mohammedPassword),
                        Role = "Admin",
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Users.Add(customUser);
                    await context.SaveChangesAsync();
                    mohammedId = customUser.Id;

                    Console.WriteLine("✅ Utilisateur mohammed créé avec succès !");
                    Console.WriteLine($"   Email: {mohammedEmail}");
                    Console.WriteLine($"   Mot de passe: {mohammedPassword}");
                    Console.WriteLine($"   ID: {mohammedId}");
                    Console.WriteLine($"   Role: Admin");
                }
                else
                {
                    Console.WriteLine("❌ Erreur lors de la création de mohammed :");
                    foreach (var error in result.Errors)
                    {
                        Console.WriteLine($"   - {error.Description}");
                    }
                    return;
                }
            }
            else
            {
                mohammedId = existingCustomUser.Id;
                Console.WriteLine($"ℹ️  L'utilisateur mohammed existe déjà (ID: {mohammedId}).");
            }

            // Créer des catégories pour mohammed
            if (!await context.Categories.AnyAsync(c => c.UserId == mohammedId))
            {
                Console.WriteLine("🔄 Création des catégories pour mohammed...");
                
                var categories = new List<Category>
                {
                    new Category { Name = "Salaire", Description = "Revenu mensuel", Type = "Revenu", Color = "#28a745", Icon = "bi-cash-coin", UserId = mohammedId },
                    new Category { Name = "Alimentation", Description = "Courses et restaurants", Type = "Depense", Color = "#dc3545", Icon = "bi-cart", UserId = mohammedId },
                    new Category { Name = "Transport", Description = "Essence, taxi, bus", Type = "Depense", Color = "#ffc107", Icon = "bi-car-front", UserId = mohammedId },
                    new Category { Name = "Logement", Description = "Loyer et charges", Type = "Depense", Color = "#17a2b8", Icon = "bi-house", UserId = mohammedId },
                    new Category { Name = "Loisirs", Description = "Sorties et divertissement", Type = "Depense", Color = "#e83e8c", Icon = "bi-controller", UserId = mohammedId }
                };

                context.Categories.AddRange(categories);
                await context.SaveChangesAsync();
                Console.WriteLine($"✅ {categories.Count} catégories créées !");
            }

            // Créer des comptes pour mohammed
            if (!await context.Accounts.AnyAsync(a => a.UserId == mohammedId))
            {
                Console.WriteLine("🔄 Création des comptes pour mohammed...");
                
                var accounts = new List<Account>
                {
                    new Account { Name = "Compte Courant", Type = "Courant", Balance = 5000.00m, AccountNumber = "****1234", Currency = "MAD", UserId = mohammedId, CreatedAt = DateTime.Now },
                    new Account { Name = "Compte Épargne", Type = "Epargne", Balance = 10000.00m, AccountNumber = "****5678", Currency = "MAD", UserId = mohammedId, CreatedAt = DateTime.Now, TargetAmount = 20000.00m },
                    new Account { Name = "Espèces", Type = "Especes", Balance = 500.00m, AccountNumber = "0000", Currency = "MAD", UserId = mohammedId, CreatedAt = DateTime.Now }
                };

                context.Accounts.AddRange(accounts);
                await context.SaveChangesAsync();
                Console.WriteLine($"✅ {accounts.Count} comptes créés !");
            }

            // Créer des transactions pour mohammed
            if (!await context.Transactions.AnyAsync(t => t.UserId == mohammedId))
            {
                Console.WriteLine("🔄 Création des transactions pour mohammed...");
                
                var categorySalaire = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Salaire" && c.UserId == mohammedId);
                var categoryAlimentation = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Alimentation" && c.UserId == mohammedId);
                var categoryTransport = await context.Categories.FirstOrDefaultAsync(c => c.Name == "Transport" && c.UserId == mohammedId);
                var accountCourant = await context.Accounts.FirstOrDefaultAsync(a => a.Name == "Compte Courant" && a.UserId == mohammedId);

                if (categorySalaire != null && accountCourant != null)
                {
                    var transactions = new List<Transaction>
                    {
                        new Transaction { Description = "Salaire Décembre", Amount = 8000.00m, Date = DateTime.Now, Type = "Revenu", CategoryId = categorySalaire.Id, AccountId = accountCourant.Id, UserId = mohammedId, CreatedAt = DateTime.Now },
                        new Transaction { Description = "Courses Marjane", Amount = 450.00m, Date = DateTime.Now, Type = "Depense", CategoryId = categoryAlimentation?.Id, AccountId = accountCourant.Id, UserId = mohammedId, CreatedAt = DateTime.Now },
                        new Transaction { Description = "Essence", Amount = 300.00m, Date = DateTime.Now.AddDays(-1), Type = "Depense", CategoryId = categoryTransport?.Id, AccountId = accountCourant.Id, UserId = mohammedId, CreatedAt = DateTime.Now }
                    };

                    context.Transactions.AddRange(transactions);
                    await context.SaveChangesAsync();
                    Console.WriteLine($"✅ {transactions.Count} transactions créées !");
                }
            }

            Console.WriteLine();
            Console.WriteLine("========================================");
            Console.WriteLine("RÉCAPITULATIF - Données mohammed");
            Console.WriteLine("========================================");
            Console.WriteLine($"Email: {mohammedEmail}");
            Console.WriteLine($"Mot de passe: {mohammedPassword}");
            Console.WriteLine($"ID: {mohammedId}");
            Console.WriteLine("========================================");
        }
    }
}
