namespace SuiviFinancier.DTOs
{
    /// <summary>
    /// DTO pour les statistiques du dashboard admin
    /// </summary>
    public class AdminStatsDTO
    {
        public int TotalUsers { get; set; }
        public int TotalTransactions { get; set; }
        public decimal TotalVolume { get; set; }
        public int TotalAccounts { get; set; }
        public int TotalBudgets { get; set; }
        public int ActiveUsers { get; set; }
        public int LockedUsers { get; set; }
    }
}
