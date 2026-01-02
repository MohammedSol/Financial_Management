using System.ComponentModel.DataAnnotations;

namespace SuiviFinancier.DTOs
{
    public class UpdateBudgetDTO
    {
        [Required(ErrorMessage = "Le nom du budget est requis")]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le montant est requis")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être supérieur à 0")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "La date de début est requise")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "La date de fin est requise")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "La catégorie est requise")]
        public int CategoryId { get; set; }
    }
}
