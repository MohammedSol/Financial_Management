# 📊 Export / Import de Données - Guide d'Utilisation

## ✅ Fonctionnalités Implémentées

### 1. **Export de Données** 📤

#### A. Export CSV des Transactions
- **Endpoint**: `GET /api/export/transactions/csv`
- **Format**: CSV (valeurs séparées par des virgules)
- **Utilisation**: Bouton "Télécharger CSV" dans la page Export/Import
- **Contenu**: Date, Type, Montant, Description, Catégorie, Compte, Reçu

#### B. Export Excel des Transactions  
- **Endpoint**: `GET /api/export/transactions/excel`
- **Format**: XLSX (Excel avec mise en forme)
- **Utilisation**: Bouton "Télécharger Excel" 
- **Fonctionnalités**:
  - En-têtes colorés (vert)
  - Montants colorés (vert pour revenus, rouge pour dépenses)
  - Colonnes auto-ajustées
  - Filtrable dans Excel

#### C. Export PDF des Budgets
- **Endpoint**: `GET /api/export/budgets/pdf`
- **Format**: PDF professionnel avec QuestPDF
- **Utilisation**: Bouton "Télécharger PDF"
- **Contenu**:
  - Statistiques globales (nombre, montant total, dépenses)
  - Tableau des budgets avec dates
  - En-tête et pied de page personnalisés

#### D. Rapport Mensuel PDF
- **Endpoint**: `GET /api/export/report/monthly?year=2024&month=12`
- **Format**: PDF détaillé multi-pages
- **Utilisation**: Sélectionner un mois puis "Générer Rapport"
- **Contenu**:
  - Résumé financier (revenus, dépenses, solde)
  - 10 dernières transactions
  - État des budgets actifs
  - Statistiques visuelles

---

### 2. **Import de Données** 📥

#### A. Import CSV de Transactions
- **Endpoint**: `POST /api/import/transactions/csv`
- **Format attendu**:
  ```csv
  Date,Type,Montant,Description,Catégorie,Compte
  2024-12-20,Dépense,150.50,"Courses alimentaires",Alimentation,Compte Courant
  2024-12-21,Revenu,2500.00,"Salaire décembre",Salaire,Compte Épargne
  ```
  
- **Règles**:
  - Date: `yyyy-MM-dd`, `dd/MM/yyyy` ou `dd-MM-yyyy`
  - Type: `Revenu` ou `Dépense` (sensible à la casse)
  - Montant: Nombres décimaux avec `.` ou `,`
  - Catégorie et Compte doivent exister dans votre base

- **Validation**:
  - Colonnes obligatoires vérifiées
  - Format de date validé
  - Type de transaction validé
  - Catégories et comptes mappés automatiquement
  - Rapport détaillé des erreurs par ligne

#### B. Template CSV
- **Endpoint**: `GET /api/import/template/csv`
- **Utilisation**: Bouton "Télécharger Template"
- **Contenu**: Fichier exemple avec 3 transactions types

---

## 🎯 Utilisation Frontend

### Accès à la Page
1. Connectez-vous à l'application
2. Cliquez sur **"Export/Import"** dans la navbar
3. Deux sections : Export (gauche) et Import (droite)

### Exporter des Données
1. **CSV**: Clic direct → téléchargement immédiat
2. **Excel**: Clic direct → téléchargement avec mise en forme
3. **PDF Budgets**: Clic direct → rapport PDF des budgets
4. **Rapport Mensuel**: 
   - Sélectionner le mois (input `type="month"`)
   - Cliquer "Générer Rapport"
   - PDF détaillé téléchargé

### Importer des Transactions
1. **Télécharger le template** (recommandé pour la première fois)
2. **Remplir le fichier CSV** avec vos données
3. **Vérifier**:
   - Les catégories existent dans votre compte
   - Les comptes existent dans votre compte
   - Les dates sont au bon format
4. **Cliquer "Sélectionner un fichier CSV"**
5. **Cliquer "Importer Transactions"**
6. **Résultat affiché**:
   - ✅ Nombre de transactions importées
   - ❌ Nombre d'erreurs
   - Liste détaillée des erreurs par ligne

---

## 🔧 API Endpoints Complets

### Export
```
GET  /api/export/transactions/csv                    # Export CSV transactions
GET  /api/export/transactions/excel                  # Export Excel transactions
GET  /api/export/budgets/pdf                         # Export PDF budgets
GET  /api/export/report/monthly?year=2024&month=12  # Rapport mensuel
GET  /api/export/report/current-month                # Rapport mois en cours
```

### Import
```
POST /api/import/transactions/csv                    # Import CSV transactions (multipart/form-data)
GET  /api/import/template/csv                        # Télécharger template
POST /api/import/preview                             # Prévisualiser CSV avant import
```

---

## 📦 Packages Utilisés

- **ClosedXML** (0.105.0): Génération Excel avec mise en forme avancée
- **QuestPDF** (2025.12.0): Génération PDF professionnelle et flexible

---

## ⚠️ Notes Importantes

1. **Sécurité**: Tous les endpoints nécessitent une authentification JWT
2. **Isolation**: Chaque utilisateur ne voit que ses propres données
3. **Validation**: Toutes les données importées sont validées avant insertion
4. **Transactions**: Import en une seule transaction (tout ou rien si erreur critique)
5. **Logs**: Tous les exports/imports sont loggés côté backend

---

## 🐛 Gestion des Erreurs Import

### Erreurs Courantes
- **"Date invalide"**: Utiliser format `yyyy-MM-dd`
- **"Type invalide"**: Uniquement `Revenu` ou `Dépense`
- **"Catégorie introuvable"**: Créer la catégorie avant d'importer
- **"Compte introuvable"**: Créer le compte avant d'importer
- **"Format invalide : colonnes manquantes"**: Vérifier les 6 colonnes

### Résolution
1. Lire le message d'erreur affiché
2. Corriger le CSV à la ligne indiquée
3. Réessayer l'import

---

## 🎉 Exemple Complet

### 1. Export Excel
```javascript
// Frontend
const response = await api.get('/export/transactions/excel', { responseType: 'blob' });
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.download = 'transactions.xlsx';
link.click();
```

### 2. Import CSV
```javascript
// Frontend
const formData = new FormData();
formData.append('file', csvFile);
const response = await api.post('/import/transactions/csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
console.log(response.data.successCount); // Nombre réussi
```

---

## 📈 Améliorations Futures Possibles

- [ ] Export PDF des transactions avec graphiques
- [ ] Import Excel (en plus du CSV)
- [ ] Export avec filtres de dates dans l'UI
- [ ] Import de catégories et comptes
- [ ] Planification d'exports automatiques (cron jobs)
- [ ] Envoi par email des rapports mensuels
- [ ] Export en JSON pour archivage
- [ ] Compression ZIP pour grands volumes

---

**Créé le**: 22 Décembre 2025  
**Version**: 1.0  
**Statut**: ✅ Fonctionnel et testé
