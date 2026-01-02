using System.Collections.Generic;

namespace SuiviFinancier.DTOs
{
    // Réponse pour le Dashboard (Lecture)
    public class AccountsDashboardDto
    {
        public decimal TotalBalance { get; set; }
        public List<AccountDto> Accounts { get; set; }
        public List<AssetAllocationDto> Allocation { get; set; }
    }

    // Graphique Camembert
    public class AssetAllocationDto
    {
        public string Name { get; set; }
        public decimal Value { get; set; }
    }

    // Compte (Lecture)
    public class AccountDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string AccountNumber { get; set; }
        public string Currency { get; set; }
        public string Type { get; set; }
        public decimal Balance { get; set; }
        public decimal TargetAmount { get; set; }
    }

    // 👇 AJOUTEZ CETTE CLASSE (Essentielle pour le Create/Update du Contrôleur)
    public class CreateAccountDto 
    {
        public string Name { get; set; }
        public string AccountNumber { get; set; }
        public string Currency { get; set; }
        public string Type { get; set; }
        public decimal Balance { get; set; }
        public decimal TargetAmount { get; set; }
    }
}