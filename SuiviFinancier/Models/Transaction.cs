using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace SuiviFinancier.Models;

public partial class Transaction
{
    public int Id { get; set; }

    public string Description { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string Type { get; set; } = null!;

    public int? AccountId { get; set; }

    public int? CategoryId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? ReceiptPath { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public virtual Account? Account { get; set; }

    public virtual Category? Category { get; set; }
}
