# 📚 Guide de Présentation - Backend SuiviFinancier

## 🎯 Vue d'Ensemble du Backend .NET

### Architecture Globale

Le backend est une **API RESTful** construite avec **ASP.NET Core 9.0** suivant le pattern **MVC (Model-View-Controller)** et une architecture en couches :

```
┌─────────────────────────────────────────────────┐
│           CLIENT (React Frontend)               │
└─────────────────────┬───────────────────────────┘
                      │ HTTP/HTTPS + JWT
┌─────────────────────▼───────────────────────────┐
│         CONTROLLERS (API Endpoints)             │
│  • AuthController (Login/Register)              │
│  • TransactionsApiController (CRUD)             │
│  • BudgetsApiController, etc.                   │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              SERVICES LAYER                     │
│  • RedisService (Cache)                         │
│  • CategoryPredictorService (ML.NET)            │
│  • BackgroundServices (Tâches planifiées)       │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│         DATA ACCESS (Entity Framework)          │
│              AppDbContext                       │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│       DATABASE (SQL Server LocalDB)             │
│  • AspNetUsers (Identity)                       │
│  • Users, Transactions, Budgets, etc.           │
└─────────────────────────────────────────────────┘
```

---

## 📦 1. SuiviFinancier.csproj - Fichier de Projet

### Rôle
C'est le **fichier de configuration principal** du projet .NET. Il définit :
- La **version du framework** (.NET 9.0)
- Les **packages NuGet** (dépendances externes)
- Les **configurations de compilation**

### Packages Clés Installés

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <!-- 🔐 SÉCURITÉ & AUTHENTIFICATION -->
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.0" />
    <!-- JWT pour l'authentification sans état (tokens) -->
    
    <PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="9.0.0" />
    <!-- Gestion des utilisateurs (hachage de mots de passe, rôles) -->
    
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.15.0" />
    <!-- Création et validation de tokens JWT -->
    
    <PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
    <!-- Hachage sécurisé des mots de passe -->

    <!-- 💾 BASE DE DONNÉES -->
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />
    <!-- Provider SQL Server pour Entity Framework -->
    
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.0" />
    <!-- Outils pour créer les migrations (dotnet ef migrations add) -->

    <!-- ⚡ PERFORMANCE & CACHE -->
    <PackageReference Include="StackExchange.Redis" Version="2.10.1" />
    <!-- Client Redis pour le cache en mémoire -->
    
    <PackageReference Include="Microsoft.Extensions.Caching.StackExchangeRedis" Version="10.0.1" />
    <!-- Intégration Redis avec ASP.NET Core -->

    <!-- 🤖 MACHINE LEARNING -->
    <PackageReference Include="Microsoft.ML" Version="5.0.0" />
    <PackageReference Include="Microsoft.ML.FastTree" Version="5.0.0" />
    <PackageReference Include="Microsoft.ML.TimeSeries" Version="5.0.0" />
    <!-- ML.NET pour la prédiction de catégories et prévisions financières -->

    <!-- 📄 EXPORT/IMPORT -->
    <PackageReference Include="ClosedXML" Version="0.105.0" />
    <!-- Génération de fichiers Excel -->
    
    <PackageReference Include="QuestPDF" Version="2025.12.0" />
    <!-- Génération de rapports PDF -->
  </ItemGroup>
</Project>
```

**Analogie :** C'est comme le `package.json` de Node.js ou `requirements.txt` de Python.

---

## 🚀 2. Program.cs - Point d'Entrée de l'Application

### Rôle
C'est le **fichier de démarrage** qui :
1. **Configure tous les services** (DI - Dependency Injection)
2. **Configure le pipeline HTTP** (middleware)
3. **Lance l'application web**

### Structure en 2 Parties

#### PARTIE 1 : Configuration des Services (avant `var app = builder.Build();`)

```csharp
var builder = WebApplication.CreateBuilder(args);

// ==================== SERVICES ====================

// 1️⃣ CONTROLLERS API
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Évite les erreurs de références circulaires (User -> Transaction -> User)
        options.JsonSerializerOptions.ReferenceHandler = 
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 2️⃣ BASE DE DONNÉES avec Entity Framework
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);
// → Lit la chaîne de connexion depuis appsettings.json
// → Crée une instance du DbContext pour accéder à la BD

// 3️⃣ IDENTITY (Gestion des utilisateurs)
builder.Services.AddDefaultIdentity<IdentityUser>(options =>
{
    // Configuration des mots de passe (développement simplifié)
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 4;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<AppDbContext>();
// → Utilise AppDbContext pour stocker les utilisateurs

// 4️⃣ JWT AUTHENTICATION
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,          // Vérifie l'émetteur
        ValidateAudience = true,        // Vérifie l'audience
        ValidateLifetime = true,        // Vérifie l'expiration
        ValidateIssuerSigningKey = true,// Vérifie la signature
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        ),
        ClockSkew = TimeSpan.Zero // Pas de tolérance sur l'expiration
    };
});

// 5️⃣ REDIS (Cache)
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var redisConfig = builder.Configuration.GetSection("Redis")["Configuration"];
    return ConnectionMultiplexer.Connect(redisConfig);
});

// 6️⃣ SIGNALR (Notifications temps réel)
builder.Services.AddSignalR();

// 7️⃣ CORS (Autoriser les requêtes du frontend React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // URL du frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Pour SignalR
    });
});

// 8️⃣ BACKGROUND SERVICES (Tâches en arrière-plan)
builder.Services.AddHostedService<RecurringPaymentBackgroundService>();
// → Exécute automatiquement les paiements récurrents

// 9️⃣ ML.NET (Machine Learning)
builder.Services.AddSingleton<CategoryPredictorService>();
// → Service de prédiction de catégories avec IA
```

#### PARTIE 2 : Pipeline HTTP (après `var app = builder.Build();`)

```csharp
var app = builder.Build();

// ==================== MIDDLEWARE PIPELINE ====================

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Page d'erreur détaillée
}

app.UseHttpsRedirection();    // Redirection HTTP → HTTPS
app.UseStaticFiles();         // Servir les fichiers CSS/JS/Images

app.UseCors("AllowReactApp"); // Activer CORS

app.UseAuthentication();      // Activer JWT Authentication
app.UseAuthorization();       // Activer les autorisations [Authorize]

// Routes SignalR
app.MapHub<NotificationHub>("/notificationHub");

// Routes Controllers
app.MapControllers();

// 🌱 SEEDING (Données initiales)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await DbSeeder.Initialize(services); // Crée les admins par défaut
}

app.Run(); // 🚀 Lance le serveur
```

**Ordre d'exécution des Middleware :**
```
Request → HTTPS → CORS → Authentication → Authorization → Controller → Response
```

---

## 🗄️ 3. AppDbContext.cs - Pont vers la Base de Données

### Rôle
C'est le **contexte Entity Framework Core** qui :
- Représente la **session avec la base de données**
- Expose les **DbSet** (tables) sous forme de collections C#
- Configure les **relations** et **contraintes**

### Code Expliqué

```csharp
public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        // Constructeur appelé automatiquement par Dependency Injection
    }

    // ==================== TABLES (DbSet) ====================
    public DbSet<Account> Accounts { get; set; }            // Table Accounts
    public DbSet<Category> Categories { get; set; }          // Table Categories
    public DbSet<Transaction> Transactions { get; set; }     // Table Transactions
    public DbSet<Budget> Budgets { get; set; }              // Table Budgets
    public DbSet<Notification> Notifications { get; set; }   // Table Notifications
    public DbSet<RecurringPayment> RecurringPayments { get; set; }
    public new DbSet<User> Users { get; set; }              // Table Users custom (RBAC)

    // ==================== CONFIGURATION ====================
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1️⃣ Configuration de la table Users
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);                    // Clé primaire
            entity.Property(u => u.Id).ValueGeneratedOnAdd(); // Auto-increment
        });

        // 2️⃣ Relations User -> Accounts (1-N)
        modelBuilder.Entity<Account>()
            .HasOne(a => a.User)              // Un Account a un User
            .WithMany()                       // Un User a plusieurs Accounts
            .HasForeignKey(a => a.UserId)     // Clé étrangère
            .OnDelete(DeleteBehavior.Restrict); // ❌ Pas de suppression en cascade
        // → Évite les cycles de suppression (User -> Account -> Transaction)

        // 3️⃣ Configuration des colonnes DECIMAL (précision monétaire)
        modelBuilder.Entity<Account>()
            .Property(a => a.Balance)
            .HasColumnType("decimal(18,2)"); // 18 chiffres dont 2 après la virgule

        modelBuilder.Entity<Transaction>()
            .Property(t => t.Amount)
            .HasColumnType("decimal(18,2)");

        // ... autres configurations
    }
}
```

### Utilisation dans un Controller

```csharp
public class TransactionsApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsApiController(AppDbContext context)
    {
        _context = context; // Injection automatique
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        var transactions = await _context.Transactions
            .Include(t => t.Category)  // JOIN avec Categories
            .Include(t => t.Account)   // JOIN avec Accounts
            .ToListAsync();            // Exécute la requête SQL
        
        return Ok(transactions);
    }
}
```

**Requête SQL générée automatiquement :**
```sql
SELECT t.*, c.*, a.*
FROM Transactions t
INNER JOIN Categories c ON t.CategoryId = c.Id
INNER JOIN Accounts a ON t.AccountId = a.Id
```

---

## 🎮 4. CONTROLLERS - Endpoints API

### Architecture des Controllers

```
Controllers/
├── Api/                           # 🔵 API RESTful (JSON)
│   ├── AuthController.cs          # POST /api/auth/login, /register
│   ├── AdminController.cs         # GET /api/admin/stats (Admin only)
│   ├── TransactionsApiController.cs # CRUD Transactions
│   ├── BudgetsApiController.cs    # CRUD Budgets
│   ├── AccountsApiController.cs   # CRUD Accounts
│   ├── CategoriesApiController.cs # CRUD Categories
│   ├── ExportController.cs        # GET /api/export/transactions/excel
│   ├── ImportController.cs        # POST /api/import/transactions
│   ├── ForecastController.cs      # GET /api/forecast/expenses (ML.NET)
│   └── NotificationsController.cs # GET /api/notifications
└── [MVC Controllers]              # 🟢 Pages HTML (Views)
    ├── HomeController.cs
    ├── TransactionController.cs
    └── ...
```

### Exemple : AuthController.cs

```csharp
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IConnectionMultiplexer _redis;

    public AuthController(
        UserManager<IdentityUser> userManager,
        AppDbContext context,
        IConfiguration configuration,
        IConnectionMultiplexer redis)
    {
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
        _redis = redis;
    }

    // ==================== POST /api/auth/register ====================
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
    {
        // 1️⃣ Vérifier si l'email existe déjà
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email déjà utilisé" });
        }

        // 2️⃣ Créer l'utilisateur dans AspNetUsers (Identity)
        var identityUser = new IdentityUser
        {
            UserName = dto.Email,
            Email = dto.Email
        };

        var result = await _userManager.CreateAsync(identityUser, dto.Password);
        // → Hache automatiquement le mot de passe avec BCrypt

        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors });
        }

        // 3️⃣ Créer l'utilisateur dans Users (table custom pour RBAC)
        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "User", // Par défaut
            UserId = identityUser.Id,
            CreatedAt = DateTime.Now
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 4️⃣ Générer le token JWT
        var token = GenerateJwtToken(user);

        // 5️⃣ Retourner la réponse
        return Ok(new AuthResponseDTO
        {
            Token = token,
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        });
    }

    // ==================== POST /api/auth/login ====================
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO dto)
    {
        // 1️⃣ Vérifier l'utilisateur Identity
        var identityUser = await _userManager.FindByEmailAsync(dto.Email);
        if (identityUser == null)
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect" });
        }

        // 2️⃣ Vérifier le mot de passe
        var passwordValid = await _userManager.CheckPasswordAsync(
            identityUser, 
            dto.Password
        );
        if (!passwordValid)
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect" });
        }

        // 3️⃣ Récupérer l'utilisateur custom
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == identityUser.Id);

        if (user == null)
        {
            return NotFound(new { message = "Utilisateur non trouvé" });
        }

        // 4️⃣ Générer le token JWT
        var token = GenerateJwtToken(user);

        // 5️⃣ Stocker le token dans Redis (pour la révocation)
        var redisDb = _redis.GetDatabase();
        await redisDb.StringSetAsync(
            $"user:{user.Id}:token", 
            token, 
            TimeSpan.FromHours(1)
        );

        return Ok(new AuthResponseDTO
        {
            Token = token,
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        });
    }

    // ==================== GÉNÉRATION JWT ====================
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Key"])
        );

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("name", user.Name)
        };

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                int.Parse(jwtSettings["ExpireMinutes"])
            ),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

**Flux d'exécution :**
```
Client → POST /api/auth/login
       ↓
1. Vérification email/password (Identity)
2. Récupération User (table custom)
3. Génération token JWT (claims: userId, email, role)
4. Stockage token dans Redis
5. Retour : { token, userId, name, email, role }
       ↓
Client → Stocke token dans localStorage
Client → Envoie token dans headers : Authorization: Bearer <token>
```

### Exemple : TransactionsApiController.cs

```csharp
[Route("api/transactions")]
[ApiController]
[Authorize] // 🔒 Nécessite un token JWT valide
public class TransactionsApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransactionsApiController(AppDbContext context)
    {
        _context = context;
    }

    // ==================== GET /api/transactions ====================
    [HttpGet]
    public async Task<IActionResult> GetTransactions()
    {
        // Récupère l'ID de l'utilisateur depuis le token JWT
        var userId = User.GetUserId(); // Extension method

        var transactions = await _context.Transactions
            .Where(t => t.UserId == userId) // Filtre par utilisateur
            .Include(t => t.Category)       // JOIN Categories
            .Include(t => t.Account)        // JOIN Accounts
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return Ok(transactions);
    }

    // ==================== GET /api/transactions/{id} ====================
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTransaction(int id)
    {
        var userId = User.GetUserId();

        var transaction = await _context.Transactions
            .Include(t => t.Category)
            .Include(t => t.Account)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
        {
            return NotFound(new { message = "Transaction non trouvée" });
        }

        return Ok(transaction);
    }

    // ==================== POST /api/transactions ====================
    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDTO dto)
    {
        var userId = User.GetUserId();

        // 1️⃣ Créer la transaction
        var transaction = new Transaction
        {
            Description = dto.Description,
            Amount = dto.Amount,
            Date = dto.Date,
            Type = dto.Type,
            AccountId = dto.AccountId,
            CategoryId = dto.CategoryId,
            UserId = userId,
            CreatedAt = DateTime.Now
        };

        _context.Transactions.Add(transaction);

        // 2️⃣ Mettre à jour le solde du compte
        var account = await _context.Accounts.FindAsync(dto.AccountId);
        if (account == null)
        {
            return BadRequest(new { message = "Compte non trouvé" });
        }

        if (dto.Type == "Income")
        {
            account.Balance += dto.Amount;
        }
        else // Expense
        {
            account.Balance -= dto.Amount;
        }

        // 3️⃣ Sauvegarder dans la base de données
        await _context.SaveChangesAsync();

        // 4️⃣ Envoyer notification SignalR
        // (Code SignalR ici...)

        return CreatedAtAction(
            nameof(GetTransaction), 
            new { id = transaction.Id }, 
            transaction
        );
    }

    // ==================== PUT /api/transactions/{id} ====================
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTransaction(
        int id, 
        [FromBody] UpdateTransactionDto dto)
    {
        var userId = User.GetUserId();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
        {
            return NotFound();
        }

        // Mettre à jour les propriétés
        transaction.Description = dto.Description;
        transaction.Amount = dto.Amount;
        transaction.Date = dto.Date;
        transaction.CategoryId = dto.CategoryId;

        await _context.SaveChangesAsync();

        return NoContent(); // 204 No Content
    }

    // ==================== DELETE /api/transactions/{id} ====================
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        var userId = User.GetUserId();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null)
        {
            return NotFound();
        }

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
```

**Requêtes HTTP :**
```http
GET    /api/transactions          → Liste toutes les transactions
GET    /api/transactions/5        → Récupère la transaction #5
POST   /api/transactions          → Crée une transaction
PUT    /api/transactions/5        → Modifie la transaction #5
DELETE /api/transactions/5        → Supprime la transaction #5
```

---

## 📋 5. DTOs (Data Transfer Objects)

### Rôle
Les DTOs sont des **classes simplifiées** pour :
- **Recevoir des données du client** (requêtes)
- **Envoyer des données au client** (réponses)
- **Valider les données** (Data Annotations)
- **Masquer les propriétés sensibles** (ex: mot de passe haché)

### Pourquoi utiliser des DTOs ?

❌ **Sans DTO :**
```csharp
[HttpPost]
public IActionResult CreateTransaction([FromBody] Transaction transaction)
{
    // Problème : Le client peut envoyer n'importe quelle propriété
    // transaction.Id = 999; ← Peut modifier l'ID
    // transaction.UserId = 123; ← Peut se faire passer pour un autre user
}
```

✅ **Avec DTO :**
```csharp
[HttpPost]
public IActionResult CreateTransaction([FromBody] CreateTransactionDTO dto)
{
    // Le client ne peut envoyer que les champs définis dans le DTO
    var transaction = new Transaction
    {
        Description = dto.Description,
        Amount = dto.Amount,
        // ... autres champs contrôlés
        UserId = User.GetUserId(), // ← Sécurisé, vient du token JWT
        CreatedAt = DateTime.Now    // ← Géré par le serveur
    };
}
```

### Exemples de DTOs

#### LoginDTO.cs
```csharp
public class LoginDTO
{
    [Required(ErrorMessage = "L'email est requis")]
    [EmailAddress(ErrorMessage = "Format d'email invalide")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Le mot de passe est requis")]
    [MinLength(4, ErrorMessage = "Le mot de passe doit contenir au moins 4 caractères")]
    public string Password { get; set; } = string.Empty;
}
```

#### RegisterDTO.cs
```csharp
public class RegisterDTO
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(4)]
    public string Password { get; set; } = string.Empty;
}
```

#### AuthResponseDTO.cs
```csharp
public class AuthResponseDTO
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
```

#### CreateTransactionDTO.cs
```csharp
public class CreateTransactionDTO
{
    [Required]
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Le montant doit être positif")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [RegularExpression("Income|Expense", ErrorMessage = "Type invalide")]
    public string Type { get; set; } = string.Empty;

    [Required]
    public int AccountId { get; set; }

    [Required]
    public int CategoryId { get; set; }
}
```

**Validation automatique :**
```csharp
[HttpPost]
public IActionResult Create([FromBody] CreateTransactionDTO dto)
{
    if (!ModelState.IsValid)
    {
        // ASP.NET Core retourne automatiquement les erreurs de validation
        return BadRequest(ModelState);
    }
    // ... suite du code
}
```

---

## 🔄 6. BackgroundServices

### RecurringPaymentBackgroundService.cs

#### Rôle
Service qui **s'exécute en arrière-plan** pour traiter automatiquement les **paiements récurrents** (abonnements, loyers, etc.).

#### Code Expliqué

```csharp
public class RecurringPaymentBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RecurringPaymentBackgroundService> _logger;

    public RecurringPaymentBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<RecurringPaymentBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 Service de paiements récurrents démarré");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 1️⃣ Créer un scope pour accéder aux services scoped (DbContext)
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider
                        .GetRequiredService<AppDbContext>();

                    // 2️⃣ Récupérer les paiements à traiter
                    var today = DateTime.Today;
                    var paymentsToProcess = await context.RecurringPayments
                        .Where(rp => rp.IsActive && rp.NextPaymentDate <= today)
                        .ToListAsync(stoppingToken);

                    _logger.LogInformation(
                        $"📊 {paymentsToProcess.Count} paiements à traiter"
                    );

                    foreach (var payment in paymentsToProcess)
                    {
                        // 3️⃣ Créer la transaction
                        var transaction = new Transaction
                        {
                            Description = $"[Récurrent] {payment.Description}",
                            Amount = payment.Amount,
                            Date = DateTime.Now,
                            Type = "Expense",
                            AccountId = payment.AccountId,
                            CategoryId = payment.CategoryId,
                            UserId = payment.UserId,
                            CreatedAt = DateTime.Now
                        };

                        context.Transactions.Add(transaction);

                        // 4️⃣ Mettre à jour le solde du compte
                        var account = await context.Accounts
                            .FindAsync(payment.AccountId);
                        if (account != null)
                        {
                            account.Balance -= payment.Amount;
                        }

                        // 5️⃣ Calculer la prochaine date de paiement
                        payment.NextPaymentDate = payment.Frequency switch
                        {
                            "Daily" => payment.NextPaymentDate.AddDays(1),
                            "Weekly" => payment.NextPaymentDate.AddDays(7),
                            "Monthly" => payment.NextPaymentDate.AddMonths(1),
                            "Yearly" => payment.NextPaymentDate.AddYears(1),
                            _ => payment.NextPaymentDate
                        };

                        _logger.LogInformation(
                            $"✅ Paiement traité : {payment.Description} - {payment.Amount}€"
                        );
                    }

                    // 6️⃣ Sauvegarder toutes les modifications
                    await context.SaveChangesAsync(stoppingToken);
                }

                // 7️⃣ Attendre 1 heure avant la prochaine vérification
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erreur dans le service de paiements récurrents");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        _logger.LogInformation("🛑 Service de paiements récurrents arrêté");
    }
}
```

**Enregistrement dans Program.cs :**
```csharp
builder.Services.AddHostedService<RecurringPaymentBackgroundService>();
```

**Cycle d'exécution :**
```
Application démarre
    ↓
Service démarre automatiquement
    ↓
Boucle infinie :
    1. Cherche les paiements à traiter (NextPaymentDate <= today)
    2. Crée les transactions
    3. Met à jour les comptes
    4. Calcule la prochaine date
    5. Sauvegarde en base
    6. Attend 1 heure
    ↓
Recommence
```

---

## 🔔 7. NotificationHub.cs - SignalR

### Rôle
**Hub SignalR** pour envoyer des **notifications en temps réel** aux clients connectés (via WebSocket).

### Code Expliqué

```csharp
[Authorize] // Nécessite un token JWT
public class NotificationHub : Hub
{
    private readonly AppDbContext _context;
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(AppDbContext context, ILogger<NotificationHub> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ==================== CONNEXION ====================
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.GetUserId();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation($"✅ User {userId} connecté : {connectionId}");

        // Ajouter l'utilisateur à un groupe (pour cibler les notifications)
        await Groups.AddToGroupAsync(connectionId, $"user-{userId}");

        await base.OnConnectedAsync();
    }

    // ==================== DÉCONNEXION ====================
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.GetUserId();
        var connectionId = Context.ConnectionId;

        _logger.LogInformation($"❌ User {userId} déconnecté : {connectionId}");

        await Groups.RemoveFromGroupAsync(connectionId, $"user-{userId}");

        await base.OnDisconnectedAsync(exception);
    }

    // ==================== MÉTHODE APPELABLE PAR LE CLIENT ====================
    public async Task MarkAsRead(int notificationId)
    {
        var userId = Context.User?.GetUserId();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"📖 Notification {notificationId} marquée comme lue");
        }
    }
}
```

### Utilisation dans un Controller

```csharp
public class TransactionsApiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionDTO dto)
    {
        var userId = User.GetUserId();

        // 1️⃣ Créer la transaction
        var transaction = new Transaction { /* ... */ };
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        // 2️⃣ Créer une notification
        var notification = new Notification
        {
            UserId = userId,
            Title = "Nouvelle transaction",
            Message = $"Transaction de {transaction.Amount}€ créée",
            CreatedAt = DateTime.Now,
            IsRead = false
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // 3️⃣ Envoyer la notification en temps réel via SignalR
        await _hubContext.Clients
            .Group($"user-{userId}") // Cible uniquement cet utilisateur
            .SendAsync("ReceiveNotification", new
            {
                id = notification.Id,
                title = notification.Title,
                message = notification.Message,
                createdAt = notification.CreatedAt
            });

        return Ok(transaction);
    }
}
```

### Frontend (React) - Connexion SignalR

```javascript
import * as signalR from '@microsoft/signalr';

const token = localStorage.getItem('token');

const connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5000/notificationHub', {
        accessTokenFactory: () => token // Envoie le JWT
    })
    .withAutomaticReconnect()
    .build();

// Écouter les notifications
connection.on('ReceiveNotification', (notification) => {
    console.log('📩 Nouvelle notification:', notification);
    // Afficher une toast notification
});

await connection.start();
```

---

## 🔄 8. Flux Complet - De la Requête à la Base de Données

### Scénario : Créer une Transaction

```
┌──────────────────────────────────────────────────────────────────┐
│                    1. CLIENT (React)                              │
│  User clique sur "Ajouter Transaction"                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ POST /api/transactions
                             │ Authorization: Bearer eyJhbGc...
                             │ Body: { description, amount, date, ... }
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                2. MIDDLEWARE PIPELINE                             │
│  → UseHttpsRedirection()                                          │
│  → UseCors("AllowReactApp")                                       │
│  → UseAuthentication()   ← Valide le JWT token                   │
│  → UseAuthorization()    ← Vérifie [Authorize]                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│          3. CONTROLLER - TransactionsApiController               │
│                                                                   │
│  [HttpPost]                                                       │
│  [Authorize]                                                      │
│  public async Task<IActionResult> CreateTransaction(             │
│      [FromBody] CreateTransactionDTO dto)                         │
│  {                                                                │
│      // 3.1 Validation automatique du DTO                        │
│      if (!ModelState.IsValid)                                    │
│          return BadRequest(ModelState);                           │
│                                                                   │
│      // 3.2 Récupération userId depuis le JWT                    │
│      var userId = User.GetUserId();                               │
│                                                                   │
│      // 3.3 Création de l'entité Transaction                     │
│      var transaction = new Transaction {                          │
│          Description = dto.Description,                           │
│          Amount = dto.Amount,                                     │
│          UserId = userId,                                         │
│          CreatedAt = DateTime.Now                                 │
│      };                                                           │
│                                                                   │
│      // 3.4 Ajout dans le DbContext                              │
│      _context.Transactions.Add(transaction);                      │
│                                                                   │
│      // 3.5 Sauvegarde en base (génère le SQL)                   │
│      await _context.SaveChangesAsync();                           │
│  }                                                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              4. ENTITY FRAMEWORK CORE                             │
│                                                                   │
│  • Génère la requête SQL :                                        │
│    INSERT INTO Transactions                                       │
│    (Description, Amount, Date, Type, UserId, CreatedAt)           │
│    VALUES (@p0, @p1, @p2, @p3, @p4, @p5)                          │
│                                                                   │
│  • Exécute la requête                                             │
│  • Récupère l'ID généré (IDENTITY)                                │
│  • Met à jour transaction.Id                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                5. SQL SERVER DATABASE                             │
│                                                                   │
│  [Transactions] Table                                             │
│  ┌────┬─────────────┬────────┬────────────┬────────┬─────────┐  │
│  │ Id │ Description │ Amount │    Date    │ UserId │ CreatedAt│  │
│  ├────┼─────────────┼────────┼────────────┼────────┼─────────┤  │
│  │ 1  │ Salaire     │ 2500   │ 2025-01-01 │   1    │ ...     │  │
│  │ 2  │ Loyer       │ -800   │ 2025-01-05 │   1    │ ...     │  │
│  │ 3  │ Courses     │ -150   │ 2025-01-10 │   1    │ ...     │  │ ← Nouvelle
│  └────┴─────────────┴────────┴────────────┴────────┴─────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ Succès
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              6. SIGNALR - Notification Temps Réel                 │
│                                                                   │
│  await _hubContext.Clients                                        │
│      .Group($"user-{userId}")                                     │
│      .SendAsync("ReceiveNotification", notification);             │
│                                                                   │
│  → Envoie via WebSocket au client connecté                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              7. RÉPONSE AU CLIENT                                 │
│                                                                   │
│  return CreatedAtAction(                                          │
│      nameof(GetTransaction),                                      │
│      new { id = transaction.Id },                                 │
│      transaction                                                  │
│  );                                                               │
│                                                                   │
│  HTTP 201 Created                                                 │
│  Location: /api/transactions/3                                    │
│  Body: { id: 3, description: "Courses", amount: 150, ... }       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              8. CLIENT REÇOIT LA RÉPONSE                          │
│                                                                   │
│  • Reçoit la transaction créée                                    │
│  • Reçoit la notification SignalR                                 │
│  • Met à jour l'UI (liste des transactions)                       │
│  • Affiche une toast "Transaction créée"                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 9. Résumé des Concepts Clés

### Entity Framework Core
```csharp
// ORM (Object-Relational Mapping)
// Traduit les objets C# en requêtes SQL

var transactions = await _context.Transactions
    .Where(t => t.UserId == userId)      // WHERE UserId = @userId
    .Include(t => t.Category)            // INNER JOIN Categories
    .OrderBy(t => t.Date)                // ORDER BY Date
    .Take(10)                             // TOP 10
    .ToListAsync();                       // Exécute SELECT
```

### Dependency Injection
```csharp
// Program.cs : Enregistrement
builder.Services.AddDbContext<AppDbContext>();
builder.Services.AddSingleton<IConnectionMultiplexer>();

// Controller : Injection
public class MyController : ControllerBase
{
    private readonly AppDbContext _context;
    
    public MyController(AppDbContext context) // ← Injecté automatiquement
    {
        _context = context;
    }
}
```

### JWT Authentication
```csharp
// 1. Générer le token (AuthController)
var token = new JwtSecurityToken(
    claims: new[] {
        new Claim(ClaimTypes.NameIdentifier, userId),
        new Claim(ClaimTypes.Role, "Admin")
    },
    expires: DateTime.UtcNow.AddHours(1)
);

// 2. Client envoie le token
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// 3. Valider automatiquement (Middleware)
[Authorize] // ← Vérifie le token
[Authorize(Roles = "Admin")] // ← Vérifie le rôle
```

### Async/Await
```csharp
// ❌ BLOQUANT (mauvais)
var data = _context.Transactions.ToList(); // Bloque le thread

// ✅ ASYNCHRONE (bon)
var data = await _context.Transactions.ToListAsync(); 
// Libère le thread pendant l'attente de la BD
```

---

## 🎤 10. Points Clés pour la Présentation

### Structure à Expliquer

1. **"Notre backend est une API RESTful en .NET 9"**
   - Explique qu'elle reçoit des requêtes HTTP (GET, POST, PUT, DELETE)
   - Retourne des données JSON

2. **"Entity Framework Core gère la base de données"**
   - ORM qui traduit les objets C# en SQL
   - Migrations pour créer/modifier les tables
   - DbContext comme pont vers la BD

3. **"JWT pour la sécurité"**
   - Authentification sans état (pas de sessions)
   - Token contient userId + role
   - Validé automatiquement sur chaque requête

4. **"SignalR pour le temps réel"**
   - WebSocket pour les notifications
   - Push depuis le serveur vers le client

5. **"Redis pour la performance"**
   - Cache en mémoire
   - Stocke les tokens, données fréquentes

6. **"Background Services pour les tâches planifiées"**
   - Exécute automatiquement les paiements récurrents
   - Tourne en arrière-plan

7. **"ML.NET pour l'intelligence artificielle"**
   - Prédiction de catégories
   - Prévisions de dépenses

### Démonstration Suggérée

1. Montrer `Program.cs` et expliquer les services
2. Ouvrir `AuthController.cs` et expliquer le login
3. Montrer `AppDbContext.cs` et les tables
4. Expliquer un CRUD complet (TransactionsApiController)
5. Montrer le flux avec un diagramme

---

**Bon courage pour votre présentation ! 🚀**
