# 🔔 Guide Notifications & Alertes - Suivi Financier

## 📋 Table des Matières
- [Vue d'ensemble](#vue-densemble)
- [Architecture SignalR](#architecture-signalr)
- [Types de Notifications](#types-de-notifications)
- [Backend - API Endpoints](#backend---api-endpoints)
- [Frontend - Composants React](#frontend---composants-react)
- [Paiements Récurrents](#paiements-récurrents)
- [Utilisation](#utilisation)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Le système de notifications en temps réel permet de :
- **Alertes budgétaires** : Notification automatique quand un budget dépasse 80% ou 100%
- **Transactions importantes** : Alerte pour les transactions > 1000 MAD
- **Rappels de paiements** : Notifications automatiques pour les paiements récurrents (loyer, abonnements, etc.)
- **Communication temps réel** : Notifications instantanées via WebSocket (SignalR)

### Technologies utilisées
- **Backend** : ASP.NET Core SignalR Hub
- **Frontend** : @microsoft/signalr (client JavaScript)
- **Base de données** : SQL Server avec tables Notifications et RecurringPayments
- **Background Service** : Vérification horaire des paiements récurrents

---

## 🏗️ Architecture SignalR

### Qu'est-ce que SignalR ?
SignalR est une bibliothèque Microsoft qui permet la **communication bidirectionnelle en temps réel** entre le serveur et les clients via WebSocket.

### Schéma de fonctionnement
```
┌─────────────────┐        WebSocket         ┌─────────────────┐
│  React Client   │ ◄──────────────────────► │  SignalR Hub    │
│  (NotificationBell)                        │  (Backend)      │
└─────────────────┘                          └─────────────────┘
         │                                            │
         │                                            │
         ▼                                            ▼
  Browser Notification               ┌──────────────────────────┐
  (Popup natif)                      │  NotificationService     │
                                     │  - CheckBudgetAlertsAsync│
                                     │  - NotifyImportantTrans  │
                                     │  - SendRecurringPayment  │
                                     └──────────────────────────┘
                                                  │
                                                  ▼
                                     ┌──────────────────────────┐
                                     │  Notifications Table     │
                                     │  (SQL Server)            │
                                     └──────────────────────────┘
```

### Connexion SignalR
Le frontend se connecte au Hub avec authentification JWT :
```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5161/notificationHub', {
    accessTokenFactory: () => localStorage.getItem('token')
  })
  .withAutomaticReconnect()
  .build();
```

---

## 🔔 Types de Notifications

### 1. **Alertes Budgétaires** (Type: "Budget")
- **Déclenchement** : Après chaque création de transaction
- **Conditions** :
  - ⚠️ **Warning** : Budget dépassé à 80%+ (severity: `warning`, orange)
  - 🚨 **Error** : Budget dépassé à 100%+ (severity: `error`, rouge)
- **Exemple** :
  ```
  Titre : "⚠️ Budget bientôt dépassé"
  Message : "Le budget 'Alimentation' a atteint 85% (850 / 1000 MAD)"
  ```

### 2. **Transactions Importantes** (Type: "Transaction")
- **Déclenchement** : Création d'une transaction > 1000 MAD
- **Severity** : `info` (bleu)
- **Exemple** :
  ```
  Titre : "💰 Transaction importante"
  Message : "Transaction de 1500 MAD créée (Achat électroménager)"
  ```

### 3. **Rappels de Paiements** (Type: "Payment")
- **Déclenchement** : Background service (toutes les heures)
- **Condition** : Jour du mois correspond au `DayOfMonth` configuré
- **Severity** : `warning` (orange)
- **Exemple** :
  ```
  Titre : "📅 Rappel de paiement"
  Message : "N'oubliez pas le paiement : Loyer (800 MAD)"
  ```

---

## 🛠️ Backend - API Endpoints

### Base URL : `http://localhost:5161/api`

### **Notifications**

#### 1. Récupérer toutes les notifications
```http
GET /notifications?unreadOnly=false
Authorization: Bearer {token}
```
**Paramètres** :
- `unreadOnly` (bool, optionnel) : Filtrer uniquement les non-lues

**Réponse** :
```json
[
  {
    "id": 1,
    "userId": "guid-user-id",
    "type": "Budget",
    "title": "⚠️ Budget bientôt dépassé",
    "message": "Le budget 'Alimentation' a atteint 85%",
    "severity": "warning",
    "isRead": false,
    "createdAt": "2025-01-07T10:30:00Z",
    "relatedEntityId": 5,
    "actionUrl": "/budgets"
  }
]
```

#### 2. Nombre de notifications non-lues
```http
GET /notifications/count
Authorization: Bearer {token}
```
**Réponse** :
```json
{
  "unreadCount": 3
}
```

#### 3. Marquer une notification comme lue
```http
PUT /notifications/{id}/read
Authorization: Bearer {token}
```

#### 4. Marquer toutes comme lues
```http
PUT /notifications/read-all
Authorization: Bearer {token}
```

#### 5. Supprimer une notification
```http
DELETE /notifications/{id}
Authorization: Bearer {token}
```

#### 6. Forcer la vérification des budgets
```http
POST /notifications/check-budgets
Authorization: Bearer {token}
```
**Usage** : Utile pour tester ou déclencher manuellement la vérification.

---

### **Paiements Récurrents**

#### 1. Lister tous les paiements récurrents
```http
GET /recurringpayments
Authorization: Bearer {token}
```
**Réponse** :
```json
[
  {
    "id": 1,
    "userId": "guid-user-id",
    "name": "Loyer",
    "amount": 800.00,
    "dayOfMonth": 5,
    "categoryId": 3,
    "accountId": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "lastNotificationDate": "2025-01-05T08:00:00Z",
    "category": {
      "id": 3,
      "name": "Logement"
    },
    "account": {
      "id": 1,
      "name": "Compte Principal"
    }
  }
]
```

#### 2. Créer un paiement récurrent
```http
POST /recurringpayments
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Netflix",
  "amount": 149.99,
  "dayOfMonth": 15,
  "categoryId": 5,
  "accountId": 1,
  "isActive": true
}
```

#### 3. Modifier un paiement récurrent
```http
PUT /recurringpayments/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 1,
  "name": "Netflix Premium",
  "amount": 179.99,
  "dayOfMonth": 15,
  "categoryId": 5,
  "accountId": 1,
  "isActive": true
}
```

#### 4. Activer/Désactiver un paiement
```http
PUT /recurringpayments/{id}/toggle
Authorization: Bearer {token}
```

#### 5. Supprimer un paiement récurrent
```http
DELETE /recurringpayments/{id}
Authorization: Bearer {token}
```

---

## ⚛️ Frontend - Composants React

### 1. **NotificationBell** (Cloche dans la Navbar)

Composant qui affiche :
- 🔔 Icône de cloche avec badge indiquant le nombre de notifications non-lues
- Menu déroulant avec les 10 dernières notifications
- Actions : Marquer comme lu, Supprimer, Marquer tout comme lu

**Emplacement** : `src/components/NotificationBell.jsx`

**Intégration** :
```jsx
import NotificationBell from './NotificationBell';

<Navbar>
  <NotificationBell />
</Navbar>
```

**Features** :
- ✅ Connexion SignalR automatique avec JWT
- ✅ Reconnexion automatique en cas de déconnexion
- ✅ Browser Notification API (popup natif Windows)
- ✅ Couleurs selon severity (rouge/orange/vert/bleu)
- ✅ Rafraîchissement en temps réel

---

### 2. **RecurringPayments** (Page de gestion)

Interface CRUD complète pour gérer les paiements récurrents.

**Route** : `/recurring-payments`

**Fonctionnalités** :
- 📋 Tableau avec tous les paiements
- ➕ Bouton "Nouveau Paiement" avec formulaire modal
- ✏️ Modifier un paiement existant
- 🗑️ Supprimer un paiement
- 🔄 Toggle Actif/Inactif avec Switch
- 📊 Affichage des catégories et comptes liés

**Navigation** : Accessible depuis la Navbar → Bouton "Paiements"

---

## 📅 Paiements Récurrents

### Fonctionnement

1. **Configuration** :
   - Créer un paiement récurrent avec un nom, montant et jour du mois (1-31)
   - Optionnel : Associer une catégorie et un compte
   - Activer le paiement (switch `IsActive`)

2. **Vérification automatique** :
   - Le `RecurringPaymentBackgroundService` s'exécute toutes les heures
   - Il vérifie si le jour actuel correspond au `DayOfMonth` configuré
   - Si oui ET si aucune notification n'a été envoyée aujourd'hui → notification

3. **Notification** :
   - Type : "Payment"
   - Severity : "warning" (orange)
   - Titre : "📅 Rappel de paiement"
   - Message : "N'oubliez pas le paiement : {Nom} ({Montant} MAD)"

4. **Historique** :
   - `LastNotificationDate` est mis à jour après chaque notification
   - Évite les notifications multiples le même jour

### Cas d'usage

#### Exemple 1 : Loyer mensuel
```json
{
  "name": "Loyer Appartement",
  "amount": 3500.00,
  "dayOfMonth": 1,
  "categoryId": 3,
  "accountId": 1,
  "isActive": true
}
```
→ Notification le 1er de chaque mois

#### Exemple 2 : Abonnements
```json
{
  "name": "Spotify Premium",
  "amount": 49.99,
  "dayOfMonth": 20,
  "categoryId": 5,
  "accountId": 2,
  "isActive": true
}
```
→ Notification le 20 de chaque mois

#### Exemple 3 : Facture Internet
```json
{
  "name": "Maroc Telecom",
  "amount": 299.00,
  "dayOfMonth": 10,
  "categoryId": 4,
  "accountId": 1,
  "isActive": true
}
```
→ Notification le 10 de chaque mois

---

## 🚀 Utilisation

### Étape 1 : Configuration initiale

1. **Démarrer le backend** :
   ```powershell
   cd SuiviFinancier
   dotnet run
   ```
   → Backend sur http://localhost:5161

2. **Démarrer le frontend** :
   ```powershell
   cd suivifin-frontend
   npm run dev
   ```
   → Frontend sur http://localhost:5174

3. **Se connecter** avec vos identifiants (ex: mohammed@emsi.ma)

---

### Étape 2 : Activer les Browser Notifications

Au premier chargement, le navigateur demandera la permission :
```
"SuiviFin souhaite vous envoyer des notifications"
[Autoriser] [Bloquer]
```
→ Cliquer sur **Autoriser** pour recevoir les popups natifs

---

### Étape 3 : Configurer les paiements récurrents

1. Aller dans **Navbar → Paiements**
2. Cliquer sur **"Nouveau Paiement"**
3. Remplir le formulaire :
   - Nom : "Loyer"
   - Montant : 3500
   - Jour du mois : 1
   - Catégorie : "Logement"
   - Compte : "Compte Principal"
   - Actif : ✓
4. Cliquer sur **"Créer"**

---

### Étape 4 : Tester les notifications

#### Test 1 : Transaction importante
1. Aller dans **Transactions → Nouvelle Transaction**
2. Créer une dépense de **1500 MAD**
3. → Notification instantanée : "💰 Transaction importante"

#### Test 2 : Alerte budgétaire
1. Créer un budget de **1000 MAD** pour "Alimentation"
2. Créer des transactions totalisant **850 MAD**
3. → Notification : "⚠️ Budget bientôt dépassé (85%)"

#### Test 3 : Paiement récurrent
1. Configurer un paiement pour **aujourd'hui** (ex: jour 7)
2. Attendre maximum **1 heure** (ou redémarrer le backend)
3. → Notification : "📅 Rappel de paiement"

---

### Étape 5 : Gestion des notifications

Dans la **cloche de notifications** (Navbar) :
- 🔔 Badge rouge indique le nombre de notifications non-lues
- Cliquer sur la cloche pour ouvrir le menu
- **Actions disponibles** :
  - ✓ Marquer comme lu (change la couleur)
  - 🗑️ Supprimer
  - ✓ Marquer tout comme lu (en bas du menu)

---

## 🐛 Dépannage

### Problème 1 : Notifications ne s'affichent pas

**Symptôme** : Pas de notification après une transaction importante

**Solutions** :
1. Vérifier la connexion SignalR dans la console du navigateur (F12) :
   ```
   ✅ Connecté au NotificationHub
   ```
   Si erreur → Vérifier que le backend tourne sur port 5161

2. Vérifier les permissions du navigateur :
   - Chrome : Paramètres → Confidentialité → Notifications
   - Autoriser `http://localhost:5174`

3. Vérifier le token JWT :
   ```javascript
   console.log(localStorage.getItem('token'));
   ```
   Si null → Se reconnecter

---

### Problème 2 : Paiements récurrents ne notifient pas

**Symptôme** : Jour du mois correspond mais pas de notification

**Solutions** :
1. Vérifier que le paiement est **Actif** (switch vert)
2. Vérifier que `LastNotificationDate` n'est pas aujourd'hui :
   ```sql
   SELECT * FROM RecurringPayments WHERE IsActive = 1;
   ```
3. Forcer la notification en redémarrant le backend (relance le BackgroundService)

---

### Problème 3 : Erreur "Port 5161 is already in use"

**Symptôme** : Backend ne démarre pas

**Solution** :
```powershell
# Trouver le processus utilisant le port 5161
netstat -ano | findstr :5161

# Tuer le processus (remplacer PID)
taskkill /PID 12345 /F

# Redémarrer le backend
dotnet run
```

---

### Problème 4 : SignalR se déconnecte

**Symptôme** : Notifications arrêtent d'arriver après quelques minutes

**Solutions** :
1. **Reconnexion automatique** : Le client SignalR se reconnecte automatiquement (configuré avec `.withAutomaticReconnect()`)
2. **Vérifier l'état de connexion** :
   ```javascript
   connection.state // 'Connected', 'Disconnected', 'Reconnecting'
   ```
3. **Logs backend** : Vérifier les logs dans le terminal backend pour voir les connexions/déconnexions

---

### Problème 5 : Budget alert ne se déclenche pas

**Symptôme** : Budget dépassé mais pas de notification

**Solutions** :
1. Vérifier que le budget a bien un `TargetAmount` configuré
2. Forcer la vérification manuellement :
   ```javascript
   await api.post('/notifications/check-budgets');
   ```
3. Créer une nouvelle transaction → déclenche automatiquement la vérification

---

## 📊 Exemple de Scénario Complet

### Scénario : Gestion du budget mensuel

1. **Début du mois** (1er janvier)
   - Paiement récurrent "Loyer" (3500 MAD) → Notification à 08:00
   - Créer le budget "Alimentation" : 2000 MAD

2. **Mi-janvier** (15 janvier)
   - Transaction : Restaurant 1200 MAD → Notification "Transaction importante"
   - Budget Alimentation : 1200/2000 (60%) → Pas de notification

3. **20 janvier**
   - Paiement récurrent "Netflix" (149.99 MAD) → Notification rappel

4. **25 janvier**
   - Transaction : Supermarché 500 MAD
   - Budget Alimentation : 1700/2000 (85%) → ⚠️ Notification "Budget bientôt dépassé"

5. **28 janvier**
   - Transaction : Restaurant 400 MAD
   - Budget Alimentation : 2100/2000 (105%) → 🚨 Notification "Budget dépassé"

---

## 🎓 Concepts Avancés

### 1. **Groupes SignalR**
Chaque utilisateur est ajouté à son propre groupe (basé sur `UserId`) :
```csharp
public override async Task OnConnectedAsync() {
    var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    await Groups.AddToGroupAsync(Context.ConnectionId, userId);
}
```
→ Permet d'envoyer des notifications uniquement à l'utilisateur concerné

### 2. **Background Service**
Le `RecurringPaymentBackgroundService` utilise un `HostedService` :
```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
    while (!stoppingToken.IsCancellationRequested) {
        await CheckRecurringPaymentsAsync();
        await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
    }
}
```
→ S'exécute en parallèle de l'API sans bloquer les requêtes

### 3. **Severity Levels**
Les notifications utilisent 4 niveaux de gravité :
- `info` (bleu) : Informations générales
- `success` (vert) : Actions réussies
- `warning` (orange) : Alertes préventives
- `error` (rouge) : Problèmes critiques

---

## 📝 Notes Importantes

1. **Sécurité** :
   - Toutes les routes API nécessitent l'authentification JWT (`[Authorize]`)
   - SignalR vérifie le token avant d'établir la connexion
   - Les notifications sont filtrées par `UserId` (un utilisateur ne voit que ses propres notifications)

2. **Performance** :
   - Les notifications sont chargées par batch (limite de 10 dans le menu)
   - Index SQL sur `UserId`, `CreatedAt` et `IsRead` pour optimiser les requêtes
   - SignalR utilise WebSocket (plus rapide que HTTP polling)

3. **Limitations** :
   - Le BackgroundService vérifie toutes les heures (pas de notification instantanée pour les paiements)
   - Browser Notifications nécessitent HTTPS en production (OK pour localhost)
   - Maximum 10 notifications dans le menu (voir page dédiée pour l'historique complet - À CRÉER)

---

## 🔜 Améliorations Futures

1. **Email Notifications** : Envoyer des emails pour les notifications critiques
2. **SMS via Twilio** : Rappels par SMS pour les paiements importants
3. **Préférences utilisateur** : Choisir quels types de notifications recevoir
4. **Historique complet** : Page dédiée avec filtres et recherche
5. **Statistiques** : Dashboard des notifications (combien de budgets dépassés, etc.)
6. **Sons personnalisés** : Ajouter des effets sonores selon le type de notification
7. **Push Notifications** : Intégration PWA pour les notifications mobiles
8. **Templates personnalisables** : Laisser l'utilisateur modifier le texte des notifications

---

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs du backend (terminal dotnet run)
2. Consulter la console navigateur (F12)
3. Vérifier les tables SQL :
   ```sql
   SELECT * FROM Notifications ORDER BY CreatedAt DESC;
   SELECT * FROM RecurringPayments WHERE IsActive = 1;
   ```

---

**Bon usage du système de notifications ! 🎉**
