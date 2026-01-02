namespace SuiviFinancier.DTOs
{
    /// <summary>
    /// DTO pour afficher les informations utilisateur dans l'interface Admin
    /// </summary>
    public class AdminUserDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsLocked { get; set; }
        
        // Statistiques optionnelles
        public int AccountsCount { get; set; }
        public int TransactionsCount { get; set; }
    }
}
