using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace SuiviFinancier.Models;

public partial class Account
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Type { get; set; } = null!;

    public decimal Balance { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; }

    public string AccountNumber { get; set; } = null!;

    public string Currency { get; set; } = null!;

    public decimal? TargetAmount { get; set; }

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
