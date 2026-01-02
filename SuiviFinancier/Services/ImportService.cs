using SuiviFinancier.Models;
using System.Globalization;
using SuiviFinancier.Extensions;

namespace SuiviFinancier.Services
{
    public class ImportService
    {
        private readonly ILogger<ImportService> _logger;

        public ImportService(ILogger<ImportService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Importer des transactions depuis un fichier CSV
        /// Format attendu: Date,Type,Montant,Description,Catégorie,Compte
        /// </summary>
        public ImportResult ImportTransactionsFromCsv(
            Stream csvStream,
            int userId,
            Dictionary<string, int> categoryMap,
            Dictionary<string, int> accountMap)
        {
            var result = new ImportResult();
            
            try
            {
                using var reader = new StreamReader(csvStream);// Lire l'en-tête
                var header = reader.ReadLine();
                if (string.IsNullOrEmpty(header))
                {
                    result.Errors.Add("Le fichier CSV est vide");
                    return result;
                }

                int lineNumber = 1;
                
                while (!reader.EndOfStream)
                {
                    lineNumber++;
                    var line = reader.ReadLine();
                    
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    try
                    {
                        var transaction = ParseCsvLine(line, userId, categoryMap, accountMap);
                        result.Transactions.Add(transaction);
                        result.SuccessCount++;
                    }
                    catch (Exception ex)
                    {
                        result.Errors.Add($"Ligne {lineNumber}: {ex.Message}");
                        result.ErrorCount++;
                    }
                }

                _logger.LogInformation($"📥 Import CSV : {result.SuccessCount} réussies, {result.ErrorCount} erreurs");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur lors de l'import CSV");
                result.Errors.Add($"Erreur générale : {ex.Message}");
            }

            return result;
        }

        /// <summary>
        /// Parser une ligne CSV en Transaction
        /// </summary>
        private Transaction ParseCsvLine(
            string line,
            int userId,
            Dictionary<string, int> categoryMap,
            Dictionary<string, int> accountMap)
        {
            var parts = ParseCsvLineParts(line);
            
            if (parts.Length < 6)
            {
                throw new Exception("Format invalide : colonnes manquantes");
            }

            // Parsing de la date
            if (!DateTime.TryParseExact(parts[0], new[] { "yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy" },
                CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime date))
            {
                throw new Exception($"Date invalide : {parts[0]}");
            }

            // Validation du type
            var type = parts[1].Trim();
            if (type != "Revenu" && type != "Dépense")
            {
                throw new Exception($"Type invalide : {type}. Attendu: Revenu ou Dépense");
            }

            // Parsing du montant
            if (!decimal.TryParse(parts[2].Trim().Replace(",", "."), 
                NumberStyles.Any, CultureInfo.InvariantCulture, out decimal amount))
            {
                throw new Exception($"Montant invalide : {parts[2]}");
            }

            var description = parts[3].Trim().Trim('"');
            var categoryName = parts[4].Trim();
            var accountName = parts[5].Trim();

            // Mapper catégorie
            int? categoryId = null;
            if (!string.IsNullOrEmpty(categoryName) && categoryName != "N/A")
            {
                if (categoryMap.TryGetValue(categoryName, out int catId))
                {
                    categoryId = catId;
                }
                else
                {
                    throw new Exception($"Catégorie introuvable : {categoryName}");
                }
            }

            // Mapper compte
            int? accountId = null;
            if (!string.IsNullOrEmpty(accountName) && accountName != "N/A")
            {
                if (accountMap.TryGetValue(accountName, out int accId))
                {
                    accountId = accId;
                }
                else
                {
                    throw new Exception($"Compte introuvable : {accountName}");
                }
            }

            return new Transaction
            {
                Date = date,
                Type = type,
                Amount = amount,
                Description = description,
                CategoryId = categoryId,
                AccountId = accountId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Parser une ligne CSV en tenant compte des guillemets
        /// </summary>
        private string[] ParseCsvLineParts(string line)
        {
            var parts = new List<string>();
            var current = new System.Text.StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    parts.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            parts.Add(current.ToString());
            return parts.ToArray();
        }
    }

    /// <summary>
    /// Résultat de l'import
    /// </summary>
    public class ImportResult
    {
        public List<Transaction> Transactions { get; set; } = new();
        public int SuccessCount { get; set; }
        public int ErrorCount { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
