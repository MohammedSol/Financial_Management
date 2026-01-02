namespace SuiviFinancier.Models
{
    /// <summary>
    /// Modèle de notification pour l'utilisateur
    /// </summary>
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } = string.Empty; // "Budget", "Transaction", "Payment"
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "info"; // "info", "warning", "error", "success"
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Données additionnelles optionnelles
        public int? RelatedEntityId { get; set; }
        public string? ActionUrl { get; set; }
    }

    /// <summary>
    /// Paiement récurrent (loyer, abonnements, etc.)
    /// </summary>
    public class RecurringPayment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty; // "Loyer", "Netflix", etc.
        public decimal Amount { get; set; }
        public int DayOfMonth { get; set; } // 1-31
        public int? CategoryId { get; set; }
        public int? AccountId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastNotificationDate { get; set; }
        
        // Relations
        public virtual Category? Category { get; set; }
        public virtual Account? Account { get; set; }
    }
}
