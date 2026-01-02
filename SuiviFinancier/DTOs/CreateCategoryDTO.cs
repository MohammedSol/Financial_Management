using System.ComponentModel.DataAnnotations;

namespace SuiviFinancier.DTOs
{
    public class CreateCategoryDTO
    {
        [Required(ErrorMessage = "Le nom de la catégorie est requis")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Le type est requis")]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // "Income" ou "Expense"
        
        [StringLength(20)]
        public string Color { get; set; } = "#000000";
        
        [StringLength(50)]
        public string Icon { get; set; } = "ShoppingCart";
    }
}
