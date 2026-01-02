using System;
using System.Collections.Generic;

namespace SuiviFinancier.Models
{
    public class DashboardViewModel
    {
        // --- NOUVEAU : Les dates du filtre ---
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        // Indicateurs globaux
        public decimal TotalBalance { get; set; }
        public decimal Income { get; set; }  // Renommé car ce n'est plus forcément le mois
        public decimal Expense { get; set; } // Idem pour Expense

        // Pour le graphique (Dépenses par catégorie)
        public string[] ExpenseCategoryLabels { get; set; } = Array.Empty<string>();
        public decimal[] ExpenseCategoryData { get; set; } = Array.Empty<decimal>();

        // Liste des dernières transactions
        public List<Transaction> RecentTransactions { get; set; } = new List<Transaction>();

        // --- NOUVEAU POUR LE LINE CHART ---
        // Les étiquettes de l'axe X (ex: "01/11", "02/11"...)
        public string[] SplineChartLabels { get; set; } = Array.Empty<string>();
        
        // Les données pour la ligne des Revenus
        public decimal[] IncomeDailyData { get; set; } = Array.Empty<decimal>();

        // Les données pour la ligne des Dépenses
        public decimal[] ExpenseDailyData { get; set; } = Array.Empty<decimal>();

        // --- NOUVEAU : La liste des statuts budgétaires ---
        public List<BudgetStatus> BudgetStatuses { get; set; } = new List<BudgetStatus>();

        // --- NOUVEAU : Propriétés pour le Graphique de Prévision ---
        
        // 1. Labels de l'axe X (Historique + Prévision)
        public string[] CumulativeChartLabels { get; set; } = Array.Empty<string>();
        
        // 2. Données de la courbe (Historique + Prévision)
        public decimal[] CumulativeBalanceData { get; set; } = Array.Empty<decimal>();
        
        // 3. L'index où commence la partie Prévision (pour le JS)
        public int ForecastStartIndex { get; set; }
    }

    // Nouvelle classe utilitaire simple
    public class BudgetStatus
    {
        public string CategoryName { get; set; } = string.Empty;
        public decimal LimitAmount { get; set; } // Le plafond (ex: 300)
        public decimal SpentAmount { get; set; } // Le dépensé (ex: 280)
        
        // Calcul du pourcentage (0 à 100+)
        public int Percentage => LimitAmount == 0 ? 0 : (int)((SpentAmount / LimitAmount) * 100);
    }
}
