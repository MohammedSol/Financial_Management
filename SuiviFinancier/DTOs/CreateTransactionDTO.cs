using System.ComponentModel.DataAnnotations;

namespace SuiviFinancier.DTOs
{
    public class CreateTransactionDTO
    {
        [Required(ErrorMessage = "Le montant est requis")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "La description est requise")]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "La date est requise")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Le type est requis")]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // "Income" ou "Expense"

        [Required(ErrorMessage = "La catégorie est requise")]
        public int CategoryId { get; set; }

        [Required(ErrorMessage = "Le compte est requis")]
        public int AccountId { get; set; }
    }
}
