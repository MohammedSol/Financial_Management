using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace SuiviFinancier.Models;

public partial class Budget
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public int? CategoryId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Category? Category { get; set; }
}
