using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SuiviFinancier.Models;
using System.Text;

namespace SuiviFinancier.Services
{
    public class ExportService
    {
        private readonly ILogger<ExportService> _logger;

        public ExportService(ILogger<ExportService> logger)
        {
            _logger = logger;
            // Configuration QuestPDF pour usage commercial gratuit
            QuestPDF.Settings.License = LicenseType.Community;
        }

        #region Export CSV

        /// <summary>
        /// Exporter les transactions en CSV
        /// </summary>
        public byte[] ExportTransactionsToCsv(List<Transaction> transactions)
        {
            var csv = new StringBuilder();
            
            // En-têtes
            csv.AppendLine("Date,Type,Montant,Description,Catégorie,Compte,Reçu");
            
            // Données
            foreach (var transaction in transactions)
            {
                csv.AppendLine($"{transaction.Date:yyyy-MM-dd}," +
                              $"{transaction.Type}," +
                              $"{transaction.Amount}," +
                              $"\"{transaction.Description?.Replace("\"", "\"\"")}\"," +
                              $"{transaction.Category?.Name ?? "N/A"}," +
                              $"{transaction.Account?.Name ?? "N/A"}," +
                              $"{(!string.IsNullOrEmpty(transaction.ReceiptPath) ? "Oui" : "Non")}");
            }

            _logger.LogInformation($"📄 Export CSV : {transactions.Count} transactions");
            return Encoding.UTF8.GetBytes(csv.ToString());
        }

        #endregion

        #region Export Excel

        /// <summary>
        /// Exporter les transactions en Excel
        /// </summary>
        public byte[] ExportTransactionsToExcel(List<Transaction> transactions, string userEmail)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Transactions");

            // En-tête
            worksheet.Cell(1, 1).Value = "Date";
            worksheet.Cell(1, 2).Value = "Type";
            worksheet.Cell(1, 3).Value = "Montant";
            worksheet.Cell(1, 4).Value = "Description";
            worksheet.Cell(1, 5).Value = "Catégorie";
            worksheet.Cell(1, 6).Value = "Compte";
            worksheet.Cell(1, 7).Value = "Reçu";

            // Style de l'en-tête
            var headerRange = worksheet.Range(1, 1, 1, 7);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#4CAF50");
            headerRange.Style.Font.FontColor = XLColor.White;

            // Données
            int row = 2;
            foreach (var transaction in transactions)
            {
                worksheet.Cell(row, 1).Value = transaction.Date.ToString("dd/MM/yyyy");
                worksheet.Cell(row, 2).Value = transaction.Type;
                worksheet.Cell(row, 3).Value = transaction.Amount;
                worksheet.Cell(row, 4).Value = transaction.Description ?? "";
                worksheet.Cell(row, 5).Value = transaction.Category?.Name ?? "N/A";
                worksheet.Cell(row, 6).Value = transaction.Account?.Name ?? "N/A";
                worksheet.Cell(row, 7).Value = !string.IsNullOrEmpty(transaction.ReceiptPath) ? "Oui" : "Non";

                // Coloration selon le type
                if (transaction.Type == "Dépense")
                {
                    worksheet.Cell(row, 3).Style.Font.FontColor = XLColor.Red;
                }
                else
                {
                    worksheet.Cell(row, 3).Style.Font.FontColor = XLColor.Green;
                }

                row++;
            }

            // Auto-ajuster les colonnes
            worksheet.Columns().AdjustToContents();

            // Sauvegarder dans un MemoryStream
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            
            _logger.LogInformation($"📊 Export Excel : {transactions.Count} transactions pour {userEmail}");
            return stream.ToArray();
        }

        #endregion

        #region Export PDF Budgets

        /// <summary>
        /// Exporter les budgets en PDF
        /// </summary>
        public byte[] ExportBudgetsToPdf(List<Budget> budgets, string userEmail, decimal totalSpent)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    // En-tête
                    page.Header()
                        .Height(100)
                        .Background(Colors.Green.Medium)
                        .Padding(20)
                        .Column(column =>
                        {
                            column.Item().Text("📊 Rapport des Budgets").FontSize(24).Bold().FontColor(Colors.White);
                            column.Item().Text($"Utilisateur : {userEmail}").FontSize(12).FontColor(Colors.White);
                            column.Item().Text($"Généré le : {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(10).FontColor(Colors.Grey.Lighten3);
                        });

                    // Contenu
                    page.Content()
                        .Padding(20)
                        .Column(column =>
                        {
                            // Statistiques globales
                            column.Item().PaddingBottom(20).Row(row =>
                            {
                                row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10)
                                    .Column(col =>
                                    {
                                        col.Item().Text("Total Budgets").FontSize(14).Bold();
                                        col.Item().Text($"{budgets.Count}").FontSize(20).FontColor(Colors.Blue.Medium);
                                    });

                                row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10)
                                    .Column(col =>
                                    {
                                        col.Item().Text("Montant Total Alloué").FontSize(14).Bold();
                                        col.Item().Text($"{budgets.Sum(b => b.Amount):N2} MAD").FontSize(20).FontColor(Colors.Green.Medium);
                                    });

                                row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10)
                                    .Column(col =>
                                    {
                                        col.Item().Text("Total Dépensé").FontSize(14).Bold();
                                        col.Item().Text($"{totalSpent:N2} MAD").FontSize(20).FontColor(Colors.Red.Medium);
                                    });
                            });

                            // Tableau des budgets
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(3); // Nom
                                    columns.RelativeColumn(2); // Montant
                                    columns.RelativeColumn(2); // Début
                                    columns.RelativeColumn(2); // Fin
                                    columns.RelativeColumn(2); // Catégorie
                                });

                                // En-tête du tableau
                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("Budget").Bold();
                                    header.Cell().Element(CellStyle).Text("Montant").Bold();
                                    header.Cell().Element(CellStyle).Text("Début").Bold();
                                    header.Cell().Element(CellStyle).Text("Fin").Bold();
                                    header.Cell().Element(CellStyle).Text("Catégorie").Bold();

                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.Background(Colors.Green.Medium)
                                                       .Padding(5)
                                                       .Border(1)
                                                       .BorderColor(Colors.White);
                                    }
                                });

                                // Lignes du tableau
                                foreach (var budget in budgets)
                                {
                                    table.Cell().Element(CellStyle).Text(budget.Name);
                                    table.Cell().Element(CellStyle).Text($"{budget.Amount:N2} MAD");
                                    table.Cell().Element(CellStyle).Text(budget.StartDate.ToString("dd/MM/yyyy"));
                                    table.Cell().Element(CellStyle).Text(budget.EndDate.ToString("dd/MM/yyyy"));
                                    table.Cell().Element(CellStyle).Text(budget.Category?.Name ?? "N/A");

                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.Border(1)
                                                       .BorderColor(Colors.Grey.Lighten2)
                                                       .Padding(5);
                                    }
                                }
                            });
                        });

                    // Pied de page
                    page.Footer()
                        .Height(50)
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Page ");
                            text.CurrentPageNumber();
                            text.Span(" / ");
                            text.TotalPages();
                        });
                });
            });

            var pdfBytes = document.GeneratePdf();
            _logger.LogInformation($"📄 Export PDF Budgets : {budgets.Count} budgets pour {userEmail}");
            return pdfBytes;
        }

        #endregion

        #region Rapport Mensuel PDF

        /// <summary>
        /// Générer un rapport mensuel en PDF
        /// </summary>
        public byte[] GenerateMonthlyReport(
    string userEmail,
    DateTime month,
    List<Transaction> transactions,
    List<Budget> budgets,
    decimal totalIncome,
    decimal totalExpense,
    decimal balance)
{
    var document = Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(11));

            // --- CORRECTION ICI ---
            // On a retiré .Height(120) pour laisser le header s'adapter au contenu
            page.Header()
                .Background(Colors.Blue.Darken2)
                .Padding(20)
                .Column(column =>
                {
                    column.Item().Text("💰 Rapport Financier Mensuel").FontSize(26).Bold().FontColor(Colors.White);
                    column.Item().Text($"Période : {month:MMMM yyyy}").FontSize(16).FontColor(Colors.White);
                    column.Item().Text($"Utilisateur : {userEmail}").FontSize(12).FontColor(Colors.Grey.Lighten3);
                    column.Item().Text($"Généré le : {DateTime.Now:dd/MM/yyyy à HH:mm}").FontSize(10).FontColor(Colors.Grey.Lighten3);
                });

            // Contenu
            page.Content()
                .PaddingVertical(20) // Padding vertical seulement pour éviter de réduire la largeur dispo
                .Column(column =>
                {
                    // Résumé financier
                    column.Item().PaddingBottom(20).Text("📈 Résumé Financier").FontSize(18).Bold();
                    
                    column.Item().PaddingBottom(20).Row(row =>
                    {
                        // Note : J'ai retiré les Padding(15) internes qui pouvaient être trop larges pour des petites colonnes
                        row.RelativeItem().Border(2).BorderColor(Colors.Green.Medium).Padding(10)
                            .Column(col =>
                            {
                                col.Item().Text("Revenus").FontSize(14).Bold();
                                col.Item().Text($"{totalIncome:N2} MAD").FontSize(18).FontColor(Colors.Green.Medium); // Font size ajusté
                            });

                        row.RelativeItem().Border(2).BorderColor(Colors.Red.Medium).Padding(10)
                            .Column(col =>
                            {
                                col.Item().Text("Dépenses").FontSize(14).Bold();
                                col.Item().Text($"{totalExpense:N2} MAD").FontSize(18).FontColor(Colors.Red.Medium);
                            });

                        row.RelativeItem().Border(2).BorderColor(Colors.Blue.Medium).Padding(10)
                            .Column(col =>
                            {
                                col.Item().Text("Solde").FontSize(14).Bold();
                                col.Item().Text($"{balance:N2} MAD").FontSize(18)
                                    .FontColor(balance >= 0 ? Colors.Green.Medium : Colors.Red.Medium);
                            });
                    });

                    // Transactions récentes
                    column.Item().PaddingTop(20).PaddingBottom(10).Text("📝 Dernières Transactions").FontSize(16).Bold();
                    
                    if (transactions.Any())
                    {
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2); // Élargi de 1 à 2 pour que "Dépense" rentre
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(4);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderStyle).Text("Date");
                                header.Cell().Element(HeaderStyle).Text("Type");
                                header.Cell().Element(HeaderStyle).Text("Montant");
                                header.Cell().Element(HeaderStyle).Text("Description");

                                static IContainer HeaderStyle(IContainer container)
                                {
                                    return container.Background(Colors.Blue.Darken2)
                                                .Padding(5) // Réduit de 8 à 5
                                                .Border(1)
                                                .BorderColor(Colors.White)
                                                .DefaultTextStyle(x => x.FontColor(Colors.White)); // 👈 Correction : utiliser DefaultTextStyle
                                }
                            });

                            foreach (var transaction in transactions.OrderByDescending(t => t.Date).Take(10))
                            {
                                table.Cell().Element(CellStyle).Text(transaction.Date.ToString("dd/MM"));
                                table.Cell().Element(CellStyle).Text(transaction.Type);
                                table.Cell().Element(CellStyle)
                                    .Text($"{transaction.Amount:N2}")
                                    .FontColor(transaction.Type == "Revenu" ? Colors.Green.Medium : Colors.Red.Medium);
                                table.Cell().Element(CellStyle).Text(transaction.Description ?? "-");

                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.BorderBottom(1)
                                                .BorderColor(Colors.Grey.Lighten2)
                                                .Padding(5); // Réduit de 6 à 5
                                }
                            }
                        });
                    }
                    else
                    {
                        column.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(20)
                            .AlignCenter()
                            .Text("Aucune transaction pour cette période")
                            .FontSize(12)
                            .FontColor(Colors.Grey.Medium);
                    }

                    // Budgets (Code inchangé mais sécurisé)
                    if (budgets.Any())
                    {
                        column.Item().PaddingTop(20).PaddingBottom(10).Text("💼 État des Budgets").FontSize(16).Bold();
                        
                        foreach (var budget in budgets.Take(5))
                        {
                            column.Item().PaddingBottom(10).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10)
                                .Row(row =>
                                {
                                    row.RelativeItem().Column(col =>
                                    {
                                        col.Item().Text(budget.Name).FontSize(13).Bold();
                                        col.Item().Text($"{budget.Amount:N2} MAD").FontSize(11);
                                    });
                                    // Utilisation de AutoItem au lieu de ConstantItem pour éviter les débordements
                                    row.AutoItem().AlignRight()
                                        .Text($"{budget.StartDate:dd/MM} - {budget.EndDate:dd/MM}").FontSize(10);
                                });
                        }
                    }
                });

            // Pied de page
            page.Footer()
                .Height(30) // Réduit un peu
                .AlignCenter()
                .Text(text =>
                {
                    text.Span("SuiviFin - Rapport Mensuel - Page ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
        });
    });

    var pdfBytes = document.GeneratePdf();
    _logger.LogInformation($"📊 Rapport mensuel généré pour {userEmail} - {month:MMMM yyyy}");
    return pdfBytes;
}

        #endregion
    }
}
