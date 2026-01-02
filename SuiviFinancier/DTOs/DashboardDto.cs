using System.Collections.Generic;

namespace SuiviFinancier.DTOs
{
    public class DashboardDto
    {
        public decimal TotalBalance { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpense { get; set; }
        public List<AccountDto> Accounts { get; set; }
        public List<TransactionDto> RecentTransactions { get; set; }
        public List<AssetAllocationDto> Allocation { get; set; }
        public Dictionary<string, decimal> CategoryTotals { get; set; }
    }
    // AccountDto, TransactionDto, AssetAllocationDto doivent déjà exister dans DTOs
}
