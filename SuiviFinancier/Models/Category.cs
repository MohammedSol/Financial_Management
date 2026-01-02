using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace SuiviFinancier.Models;

public partial class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string Type { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string Icon { get; set; } = null!;

    public int UserId { get; set; }
    public User? User { get; set; }

    public virtual ICollection<Budget> Budgets { get; set; } = new List<Budget>();

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
