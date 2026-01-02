namespace SuiviFinancier.DTOs
{
    /// <summary>
    /// DTO pour afficher les transactions dans l'interface Admin
    /// </summary>
    public class AdminTransactionDTO
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty;
        
        // Informations utilisateur
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        
        // Informations catégorie et compte
        public string? CategoryName { get; set; }
        public string? AccountName { get; set; }
        
        public DateTime CreatedAt { get; set; }
    }
}
