using System;
using System.Collections.Generic;

namespace SuiviFinancier.DTOs
{
    public class AdminTransactionAnalyticsDTO
    {
        // KPIs
        public int TotalTransactions { get; set; }
        public decimal TotalVolume { get; set; }
        public int UniqueUsers { get; set; }
        public int CategoriesCount { get; set; }
        public int AccountsCount { get; set; }

        // Graph: Transactions per day (last 30 days)
        public List<DailyTransactionStat> Trend { get; set; } = new();

        // Pie: Répartition par type (Revenu/Dépense)
        public List<TypeDistribution> TypeDistribution { get; set; } = new();

        // Pie: Répartition par catégorie (Top 5)
        public List<CategoryDistribution> CategoryDistribution { get; set; } = new();
    }

    public class DailyTransactionStat
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public decimal Volume { get; set; }
    }

    public class TypeDistribution
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Volume { get; set; }
    }

    public class CategoryDistribution
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Volume { get; set; }
    }
}
