using System.ComponentModel.DataAnnotations;

namespace SuiviFinancier.DTOs
{
    public class UpdateAccountDTO
    {
        [Required]
        public int Id { get; set; }

        [Required(ErrorMessage = "Le nom du compte est requis")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(20)]
        public string AccountNumber { get; set; } = "0000";

        [StringLength(10)]
        public string Currency { get; set; } = "MAD";

        [Required(ErrorMessage = "Le type de compte est requis")]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required(ErrorMessage = "Le solde est requis")]
        [DataType(DataType.Currency)]
        public decimal Balance { get; set; }

        [DataType(DataType.Currency)]
        public decimal? TargetAmount { get; set; }
    }
}
