# SuiviFinancier - Application de Suivi Financier

Application Full Stack moderne de suivi financier avec architecture séparée Backend (.NET 9) et Frontend (React + Vite).

## 🚀 Fonctionnalités

### Fonctionnalités Principales
- **Gestion des Utilisateurs** : Système d'authentification complet avec JWT
- **Gestion des Comptes** : Suivre plusieurs comptes (banque, espèces, carte de crédit, etc.)
- **Gestion des Transactions** : Enregistrer les revenus et dépenses avec catégorisation
- **Gestion des Budgets** : Définir et suivre des budgets par catégorie
- **Catégorisation** : Organiser les transactions par catégories personnalisées

### Fonctionnalités Avancées
- **🔐 RBAC (Role-Based Access Control)** : Gestion des rôles Admin et User
- **👨‍💼 Interface Administrateur** : Dashboard admin avec statistiques en temps réel
- **🔔 Notifications en Temps Réel** : SignalR pour les notifications push
- **📊 Tableaux de Bord** : Visualisation des données financières
- **🔒 Authentification JWT** : Sécurisation complète avec tokens JWT
- **⚡ Cache Redis** : Performance optimisée avec mise en cache
- **📤 Import/Export** : Gestion des données en format CSV/JSON

### 🤖 Fonctionnalités Machine Learning (ML.NET)
- **🏷️ Auto-Catégorisation Intelligente** : Classification automatique des transactions par leur titre
  - **Algorithme** : SDCA Maximum Entropy (Multiclass Classification)
  - **Exemple** : Tapez "Uber" → Le système suggère automatiquement "Transport"
  - **Endpoints** : 
    - `GET /api/ML/Train` - Entraîner le modèle
    - `GET /api/ML/Test?text=Courses Carrefour` - Tester la prédiction
  
- **📈 Prédiction du Solde Futur** : Forecasting du solde sur 7 jours
  - **Algorithme** : SSA (Singular Spectrum Analysis) - Time Series
  - **Utilisation** : Graphique avec courbe en pointillés montrant l'évolution prévue du solde
  - **Fonctionnalité** : "Serai-je à découvert le 30 du mois ?"
  - **Données** : Historique des transactions et tendances de dépenses

## 📋 Prérequis

### Backend
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [SQL Server LocalDB](https://learn.microsoft.com/fr-fr/sql/database-engine/configure-windows/sql-server-express-localdb) ou SQL Server
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pour Redis)

### Frontend
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Outils de Développement
- Un éditeur de code (Visual Studio, Visual Studio Code, ou Rider)
- [Postman](https://www.postman.com/) ou [Thunder Client](https://www.thunderclient.com/) (pour tester l'API)

## 🏗️ Structure du Projet

```
SuiviFin/
│
├── SuiviFinancier/                    # Backend API (.NET 9)
│   ├── Controllers/
│   │   ├── Api/
│   │   │   ├── AuthController.cs       # Authentification JWT
│   │   │   ├── AdminController.cs      # Endpoints Admin
│   │   │   ├── TransactionController.cs
│   │   │   ├── BudgetController.cs
│   │   │   ├── AccountController.cs
│   │   │   ├── CategoryController.cs
│   │   │   └── UserController.cs
│   │   ├── MLController.cs             # Endpoints ML (Train/Test)
│   │   └── HomeController.cs           # MVC Controller + Forecasting
│   │
│   ├── Models/
│   │   ├── User.cs
│   │   ├── Account.cs
│   │   ├── Category.cs
│   │   ├── Transaction.cs
│   │   ├── Budget.cs
│   │   └── AppDbContext.cs
│   │
│   ├── DTOs/                           # Data Transfer Objects
│   │   ├── LoginDto.cs
│   │   ├── RegisterDto.cs
│   │   └── ...
│   │
│   ├── Extensions/
│   │   └── ClaimsPrincipalExtensions.cs # Helper pour RBAC
│   │
│   ├── Hubs/
│   │   └── NotificationHub.cs          # SignalR Hub
│   │
│   ├── ML/                             # Machine Learning
│   │   ├── CategoryPredictorService.cs # Service de prédiction ML
│   │   └── TransactionData.cs          # Modèle de données ML
│   │
│   ├── MLData/
│   │   ├── training-data.csv           # Données d'entraînement
│   │   └── category-model.zip          # Modèle ML entraîné
│   │
│   ├── Services/
│   │   └── RedisService.cs             # Service Redis
│   │
│   ├── appsettings.json
│   └── Program.cs
│
├── suivifinancier-frontend/           # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx      # Route Protection RBAC
│   │   │   └── ...
│   │   │
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx          # Layout principal
│   │   │   └── AdminLayout.jsx         # Layout admin
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx  # Dashboard admin
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Budgets.jsx
│   │   │   └── ...
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx         # Context API Auth
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Configuration Axios
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml                  # Configuration Docker
└── README.md
```

## 🔧 Installation

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd SuiviFin
```

### 2. Configuration de Redis (Docker)

**Lancer Redis avec Docker Compose :**
```bash
docker-compose up -d
```

Ou **manuellement :**
```bash
docker run -d --name redis-suivifin -p 6379:6379 redis:latest
```

**Vérifier que Redis fonctionne :**
```bash
docker ps
```

### 3. Configuration Backend (.NET)

**Naviguer vers le répertoire backend :**
```bash
cd SuiviFinancier
```

**Restaurer les packages NuGet :**
```bash
dotnet restore
```

**Configurer la base de données :**

La configuration se trouve dans `appsettings.json` :
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SuiviFinancierDb;Trusted_Connection=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "VotreClésSecrèteTrèsLongueEtSécurisée123!",
    "Issuer": "SuiviFinancierAPI",
    "Audience": "SuiviFinancierClient",
    "ExpireMinutes": 60
  },
  "Redis": {
    "Configuration": "localhost:6379"
  }
}
```

**Créer et appliquer les migrations :**
```bash
dotnet ef database update
```

**Lancer le backend :**
```bash
dotnet run
```

Le backend sera accessible sur : `https://localhost:5001` et `http://localhost:5000`

### 4. Configuration Frontend (React)

**Ouvrir un nouveau terminal et naviguer vers le frontend :**
```bash
cd suivifinancier-frontend
```

**Installer les dépendances :**
```bash
npm install
```

**Configurer l'URL de l'API :**

Dans `src/services/api.js`, vérifier la baseURL :
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000'
});
```

**Lancer le frontend :**
```bash
npm run dev
```

Le frontend sera accessible sur : `http://localhost:5173`

### 5. Utilisateurs par défaut

Après le premier lancement, deux utilisateurs admin sont créés automatiquement :

**Admin 1 :**
- Email : `mohammed@gmail.com`
- Mot de passe : `Admin123`

**Admin 2 :**
- Email : `yassine2@gmail.com`
- Mot de passe : `Admin123`

## �️ Stack Technique

### Backend (.NET 9)
- **ASP.NET Core 9.0** - Framework Web API
- **Entity Framework Core 9.0** - ORM pour l'accès aux données
- **ASP.NET Core Identity** - Gestion des utilisateurs et authentification
- **JWT Bearer Authentication** - Authentification par tokens
- **SignalR** - Communication temps réel pour les notifications
- **StackExchange.Redis** - Client Redis pour la mise en cache
- **ML.NET** - Machine Learning pour la prédiction et classification
- **SQL Server / LocalDB** - Base de données relationnelle

### Frontend (React)
- **React 18** - Bibliothèque UI
- **Vite** - Build tool moderne et rapide
- **React Router v6** - Routing avec navigation
- **Material-UI (MUI) v5** - Composants UI Material Design
- **Axios** - Client HTTP pour les appels API
- **Context API** - Gestion d'état pour l'authentification

### Infrastructure
- **Docker** - Conteneurisation de Redis
- **Redis** - Cache en mémoire et gestion des tokens

## 📦 Packages Utilisés

### Backend NuGet Packages
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="9.0.0" />
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.0" />
<PackageReference Include="Microsoft.ML" Version="3.0.1" />
<PackageReference Include="Microsoft.ML.TimeSeries" Version="3.0.1" />
<PackageReference Include="StackExchange.Redis" Version="2.8.16" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.0.0" />
```

### Frontend NPM Packages
```json
{
  "dependencies": {
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  }
}
```

## 🗄️ Modèle de Données

### AspNetUsers (Identity)
- Id (string), UserName, Email, PasswordHash, PhoneNumber
- Géré par ASP.NET Core Identity
- Relations : Users (1:1)

### Users (RBAC)
- Id (int), Name, Email, Password, Role (Admin/User), CreatedAt
- UserId (string, FK vers AspNetUsers)
- Relations : AspNetUsers, Accounts, Budgets, Transactions

### Account (Compte)
- Id, Name, Type, Balance, UserId, CreatedAt
- Relations : User, Transactions

### Category (Catégorie)
- Id, Name, Description, Type (Income/Expense), UserId
- Relations : Transactions, Budgets

### Transaction
- Id, Description, Amount, Date, Type, AccountId, CategoryId, UserId, CreatedAt
- Relations : Account, Category, User

### Budget
- Id, Name, Amount, StartDate, EndDate, UserId, CategoryId, CreatedAt
- Relations : User, Category

## 🛠️ Commandes Utiles

### Docker (Redis)

```bash
# Lancer Redis
docker-compose up -d

# Arrêter Redis
docker-compose down

# Voir les logs Redis
docker logs redis-suivifin

# Se connecter au CLI Redis
docker exec -it redis-suivifin redis-cli

# Vérifier les clés Redis
docker exec -it redis-suivifin redis-cli KEYS "*"
```

### Backend (.NET)

```bash
# Naviguer vers le backend
cd SuiviFinancier

# Lancer en mode développement avec rechargement automatique
dotnet watch run

# Créer une nouvelle migration
dotnet ef migrations add <NomMigration>

# Appliquer les migrations
dotnet ef database update

# Supprimer la dernière migration
dotnet ef migrations remove

# Voir la liste des migrations
dotnet ef migrations list

# Supprimer et recréer la base de données
dotnet ef database drop --force
dotnet ef database update

# Nettoyer les fichiers de build
dotnet clean

# Publier l'application
dotnet publish -c Release
```

### Frontend (React)

```bash
# Naviguer vers le frontend
cd suivifinancier-frontend

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build

# Preview du build de production
npm run preview

# Linter le code
npm run lint
```

## 🎨 Architecture

### Backend Architecture
- **API RESTful** - Architecture orientée ressources
- **JWT Authentication** - Authentification stateless
- **RBAC (Role-Based Access Control)** - Gestion des autorisations
- **Repository Pattern** - Abstraction de l'accès aux données
- **SignalR Hubs** - Communication bidirectionnelle temps réel
- **Redis Caching** - Mise en cache des tokens et données fréquentes

### Frontend Architecture
- **Component-Based Architecture** - Composants React réutilisables
- **Context API** - Gestion d'état globale pour l'authentification
- **Protected Routes** - Routes sécurisées avec vérification des rôles
- **Layouts System** - MainLayout pour users, AdminLayout pour admins
- **Axios Interceptors** - Gestion automatique des tokens JWT
- **Material Design** - Interface utilisateur moderne et cohérente

### Sécurité
- **ASP.NET Core Identity** - Gestion sécurisée des utilisateurs
- **JWT Tokens** - Authentification sans état
- **Password Hashing** - Hachage sécurisé avec Identity
- **CORS Policy** - Configuration sécurisée pour le frontend
- **Role-Based Authorization** - Protection des endpoints par rôle

## 📝 Points Importants

### Configuration
- Le projet utilise **LocalDB** par défaut. Pour un autre serveur SQL Server, modifiez la chaîne de connexion dans `appsettings.json`
- **Redis doit être lancé** avant le backend (via Docker)
- Le frontend doit pointer vers le bon port backend (par défaut 5000/5001)

### Sécurité
- Les mots de passe sont **hachés** avec ASP.NET Core Identity
- Les tokens JWT ont une **durée de vie de 60 minutes** (configurable)
- Les tokens révoqués sont stockés dans **Redis**
- **CORS** est configuré pour accepter les requêtes du frontend

### Développement
- Les **validations** sont implémentées avec Data Annotations
- Les **erreurs** sont gérées avec des try-catch et retournent des codes HTTP appropriés
- Le **seeding** crée automatiquement deux utilisateurs admin au premier lancement
- Les **notifications** temps réel utilisent SignalR

### Performance
- **Redis** est utilisé pour mettre en cache les données fréquemment accédées
- Les requêtes EF Core utilisent **AsNoTracking()** quand approprié
- Le frontend utilise **Vite** pour un build ultra-rapide

## � Fonctionnalités Implémentées

- [x] Authentification JWT avec ASP.NET Core Identity
- [x] RBAC complet (Admin/User)
- [x] Interface administrateur avec dashboard
- [x] Notifications temps réel avec SignalR
- [x] Cache Redis pour les performances
- [x] API RESTful complète
- [x] Frontend React moderne avec Material-UI
- [x] Routes protégées par rôle
- [x] Import/Export de données (CSV/JSON)
- [x] Gestion complète des transactions, budgets, comptes- [x] **🤖 ML : Auto-catégorisation intelligente des transactions (Classification)**
- [x] **📈 ML : Prédiction du solde futur sur 7 jours (Time Series - SSA)**
## 🚧 Développements Futurs

- [ ] Graphiques et visualisations avancées
- [ ] Rapports financiers PDF
- [ ] Export Excel avec graphiques
- [ ] Application mobile (React Native)
- [ ] Tests unitaires et d'intégration
- [ ] CI/CD Pipeline
- [ ] Docker Compose complet (Backend + Frontend + Redis + SQL Server)
- [ ] Système de récupération de mot de passe par email
- [ ] Authentification à deux facteurs (2FA)
- [ ] Mode sombre/clair pour le frontend

## 🌐 URLs de l'Application

- **Frontend (React)** : http://localhost:5173
- **Backend API** : http://localhost:5000 ou https://localhost:5001
- **Swagger API Documentation** : http://localhost:5000/swagger (si activé)
- **SignalR Hub** : http://localhost:5000/notificationHub
- **Redis** : localhost:6379

## 🔍 Tests de l'API

### Authentification

**Login :**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "mohammed@gmail.com",
  "password": "Admin123!"
}
```

**Register :**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Nouveau User",
  "email": "user@example.com",
  "password": "User123!"
}
```

### Machine Learning

**Entraîner le modèle ML :**
```bash
GET http://localhost:5000/api/ML/Train
```

**Tester la prédiction de catégorie :**
```bash
GET http://localhost:5000/api/ML/Test?text=Courses Carrefour
GET http://localhost:5000/api/ML/Test?text=Uber Paris
GET http://localhost:5000/api/ML/Test?text=Netflix
```

### Admin Dashboard (nécessite JWT)

```bash
GET http://localhost:5000/api/admin/stats
Authorization: Bearer <votre-token-jwt>
```

## 📚 Documentation Supplémentaire

- `NOTIFICATIONS_GUIDE.md` - Guide complet sur l'utilisation de SignalR
- `EXPORT_IMPORT_GUIDE.md` - Guide d'import/export des données

## 📄 Licence

Ce projet est à usage éducatif.

## 👨‍💻 Auteur

Projet réalisé dans le cadre du cours .NET - EMSI S3

---

**Dernière mise à jour :** Décembre 2025 - Ajout RBAC Phase 2 & Interface Admin Phase 3
