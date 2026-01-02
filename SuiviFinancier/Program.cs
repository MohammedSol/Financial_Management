using Microsoft.EntityFrameworkCore;
using SuiviFinancier.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Authorization;
using SuiviFinancier.ML;
using SuiviFinancier.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using StackExchange.Redis;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 👇 CONFIGURATION OBLIGATOIRE POUR QUESTPDF (Licence Community gratuite)
QuestPDF.Settings.License = LicenseType.Community;
QuestPDF.Settings.EnableDebugging = true; // 👈 MODE DEBUG : Affiche les zones problématiques en ROUGE dans le PDF


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddControllersWithViews(options =>
{
    // Politique globale : verrouillage de tout le site (sauf pages Identity)
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.Filters.Add(new AuthorizeFilter(policy));
});

// Add DbContext with SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add ML.NET Category Predictor Service
builder.Services.AddSingleton<CategoryPredictorService>();

// Add Identity services
builder.Services.AddDefaultIdentity<IdentityUser>(options =>
{
    // Simplified password requirements for development
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 4;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
    .AddEntityFrameworkStores<AppDbContext>();

// ========== CONFIGURATION JWT ==========
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero // Pas de tolérance sur l'expiration
    };
    
    // Configuration pour SignalR (WebSocket avec JWT)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            // Si c'est une requête vers le Hub SignalR et qu'il y a un token
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
            {
                context.Token = accessToken;
            }
            
            return Task.CompletedTask;
        }
    };
});

// ========== CONFIGURATION REDIS ==========
var redisConfig = builder.Configuration.GetSection("Redis")["Configuration"] 
    ?? throw new InvalidOperationException("Redis Configuration not found");

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    return ConnectionMultiplexer.Connect(redisConfig);
});

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConfig;
    options.InstanceName = "SuiviFinancier:";
});

// ========== CONFIGURATION CORS POUR REACT ==========
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000") // Vite et Create-React-App
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ========== ENREGISTREMENT DES SERVICES ==========
builder.Services.AddScoped<SuiviFinancier.Services.TokenService>();
builder.Services.AddScoped<SuiviFinancier.Services.ExportService>();
builder.Services.AddScoped<SuiviFinancier.Services.ImportService>();
builder.Services.AddScoped<SuiviFinancier.Services.NotificationService>();

// ========== SIGNALR POUR NOTIFICATIONS TEMPS RÉEL ==========
builder.Services.AddSignalR();

// ========== BACKGROUND SERVICE POUR PAIEMENTS RÉCURRENTS ==========
builder.Services.AddHostedService<SuiviFinancier.BackgroundServices.RecurringPaymentBackgroundService>();

// Configure application cookies for authentication redirects
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Identity/Account/Login";
    options.LogoutPath = "/Identity/Account/Logout";
    options.AccessDeniedPath = "/Identity/Account/AccessDenied";
});

// Configure Razor Pages for Identity (sans autorisation globale)
builder.Services.AddRazorPages(options =>
{
    // Permettre l'accès anonyme aux pages d'authentification
    options.Conventions.AllowAnonymousToAreaPage("Identity", "/Account/Login");
    options.Conventions.AllowAnonymousToAreaPage("Identity", "/Account/Register");
    options.Conventions.AllowAnonymousToAreaPage("Identity", "/Account/Logout");
    options.Conventions.AllowAnonymousToAreaPage("Identity", "/Account/ForgotPassword");
    options.Conventions.AllowAnonymousToAreaPage("Identity", "/Account/ResetPassword");
});

var app = builder.Build();

// Seed mohammed user data - DÉSACTIVÉ TEMPORAIREMENT POUR LES TESTS API
/*
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        
        await DbSeeder.SeedMohammedUser(context, userManager);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Erreur lors du seeding: {ex.Message}");
    }
}
*/
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// app.UseHttpsRedirection(); // Désactivé temporairement pour les tests
app.UseRouting();

// Activer CORS pour React
app.UseCors("AllowReact");

app.UseAuthentication(); // Must be before UseAuthorization
app.UseAuthorization();

app.MapStaticAssets();
app.MapRazorPages(); // For Identity UI pages (Login, Register, etc.)
app.MapControllers(); // Pour les routes API [Route("api/[controller]")]

// ========== MAPPER LE HUB SIGNALR ==========
app.MapHub<SuiviFinancier.Hubs.NotificationHub>("/notificationHub");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

// ========== DATA SEEDING - CRÉATION DES ADMINS ==========
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        // S'assurer que la base de données existe
        context.Database.EnsureCreated();
        logger.LogInformation("✅ Base de données vérifiée/créée");

        // Créer les admins si ils n'existent pas
        var adminCredentials = new[]
        {
            new { Email = "mohammed@gmail.com", Password = "Admin123" },
            new { Email = "yassine2@gmail.com", Password = "Admin123" }
        };
        
        foreach (var admin in adminCredentials)
        {
            // 1️⃣ Vérifier si l'utilisateur existe dans AspNetUsers (Identity)
            var identityUser = await userManager.FindByEmailAsync(admin.Email);
            
            if (identityUser == null)
            {
                // Créer l'utilisateur dans AspNetUsers via UserManager
                identityUser = new IdentityUser
                {
                    UserName = admin.Email,
                    Email = admin.Email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(identityUser, admin.Password);
                
                if (result.Succeeded)
                {
                    logger.LogInformation($"✅ Utilisateur Identity créé : {admin.Email}");
                }
                else
                {
                    logger.LogError($"❌ Erreur création Identity {admin.Email}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    continue; // Passer au suivant
                }
            }
            else
            {
                // ⚠️ L'utilisateur existe, mais le mot de passe pourrait être invalide
                // On vérifie le mot de passe et on le réinitialise si nécessaire
                var passwordValid = await userManager.CheckPasswordAsync(identityUser, admin.Password);
                
                if (!passwordValid)
                {
                    logger.LogWarning($"⚠️ Mot de passe invalide pour {admin.Email}, réinitialisation...");
                    
                    // Supprimer l'ancien mot de passe et en définir un nouveau
                    var token = await userManager.GeneratePasswordResetTokenAsync(identityUser);
                    var resetResult = await userManager.ResetPasswordAsync(identityUser, token, admin.Password);
                    
                    if (resetResult.Succeeded)
                    {
                        logger.LogInformation($"✅ Mot de passe réinitialisé pour : {admin.Email}");
                    }
                    else
                    {
                        logger.LogError($"❌ Erreur réinitialisation mot de passe {admin.Email}: {string.Join(", ", resetResult.Errors.Select(e => e.Description))}");
                    }
                }
                else
                {
                    logger.LogInformation($"ℹ️ Utilisateur Identity existe déjà avec mot de passe valide : {admin.Email}");
                }
            }

            // 2️⃣ Vérifier si l'utilisateur existe dans Users (RBAC)
            var customUser = context.Users.FirstOrDefault(u => u.Email == admin.Email);
            
            if (customUser == null)
            {
                var adminUser = new SuiviFinancier.Models.User
                {
                    Name = admin.Email.Split('@')[0],
                    Email = admin.Email,
                    Password = BCrypt.Net.BCrypt.HashPassword(admin.Password),
                    Role = "Admin",
                    CreatedAt = DateTime.Now
                };

                context.Users.Add(adminUser);
                context.SaveChanges();
                logger.LogInformation($"🔑 Utilisateur RBAC créé : {admin.Email} (ID={adminUser.Id})");
            }
            else
            {
                logger.LogInformation($"ℹ️ Utilisateur RBAC existe déjà : {admin.Email} (ID={customUser.Id})");
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError($"❌ Erreur lors du seeding : {ex.Message}\n{ex.StackTrace}");
    }
}

app.Run();
