import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Paper, Typography, Button, TextField, InputAdornment, 
  Chip, Stack, Grid, Card, CardContent, IconButton, useTheme, LinearProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Add, Search, FilterList, Download, 
  TrendingUp, TrendingDown, AccountBalanceWallet, 
  Restaurant, DirectionsCar, ShoppingBag, HealthAndSafety, Home,
  Work, School, LocalCafe, Edit, Delete // 👈 Ajout des icônes Edit/Delete
} from '@mui/icons-material';
import { 
  BarChart, Bar, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import api from '../services/api';

// --- 1. COMPOSANT KPI ---
const StatCard = ({ title, amount, icon, color, trend }) => (
  <Card sx={{ height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 3 }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
      <Box>
        <Typography variant="body2" color="textSecondary" fontWeight="bold" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="800" sx={{ color: 'text.primary' }}>
          {amount}
        </Typography>
      </Box>
      <Box sx={{ bgcolor: `${color}.light`, color: `${color}.main`, p: 1.5, borderRadius: '50%', display: 'flex', opacity: 0.8 }}>
        {icon}
      </Box>
    </CardContent>
  </Card>
);

// --- 2. HELPER ICONES ---
const getCategoryIcon = (categoryName) => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('rest') || name.includes('food')) return <Restaurant fontSize="small" />;
    if (name.includes('trans') || name.includes('voiture')) return <DirectionsCar fontSize="small" />;
    if (name.includes('shop') || name.includes('achat')) return <ShoppingBag fontSize="small" />;
    if (name.includes('sant')) return <HealthAndSafety fontSize="small" />;
    return <Home fontSize="small" />;
};

export default function TransactionsPage() {
  // États
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });

  // États pour Dialog (Ajout/Modif)
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState({
      amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'Dépense', categoryId: '', accountId: ''
  });
  
  // Listes pour les sélecteurs
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- CHARGEMENT ---
  useEffect(() => {
    loadData();
    loadDependencies();
  }, []);

  const loadData = async () => {
    try {
        setLoading(true);
        const response = await api.get('/transactions');
        setTransactions(response.data);
        calculateStats(response.data);
    } catch (err) {
        console.error(err);
        setError('Impossible de charger les transactions.');
    } finally {
        setLoading(false);
    }
  };

  const loadDependencies = async () => {
      try {
          const [accRes, catRes] = await Promise.all([api.get('/accounts'), api.get('/categories')]);
          setAccounts(accRes.data);
          setCategories(catRes.data);
      } catch (e) { console.error("Erreur chargement dépendances", e); }
  };

  const calculateStats = (data) => {
      const income = data.filter(t => t.type === 'Revenu' || t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
      const expense = data.filter(t => t.type === 'Dépense' || t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
      setStats({ balance: income - expense, income, expense });
  };

  // --- ACTIONS ---
  const handleOpenDialog = (transaction = null) => {
      if (transaction) {
          setEditMode(true);
          setCurrentTransaction({
              ...transaction,
              // Sécurité sur la date pour l'input type="date"
              date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              categoryId: transaction.categoryId,
              accountId: transaction.accountId
          });
      } else {
          setEditMode(false);
          setCurrentTransaction({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'Dépense', categoryId: '', accountId: '' });
      }
      setOpenDialog(true);
  };

  const handleSave = async () => {
      try {
          const payload = {
              ...currentTransaction,
              amount: parseFloat(currentTransaction.amount),
              // Conversion sécurisée en ISO pour le backend
              date: new Date(currentTransaction.date).toISOString() 
          };

          if (editMode) {
              await api.put(`/transactions/${currentTransaction.id}`, payload);
          } else {
              await api.post('/transactions', payload);
          }
          setOpenDialog(false);
          loadData(); // Recharger
      } catch (err) {
          alert("Erreur lors de l'enregistrement");
      }
  };

  const handleDelete = async (id) => {
      if(window.confirm("Supprimer cette transaction ?")) {
          try {
              await api.delete(`/transactions/${id}`);
              loadData();
          } catch(e) { alert("Erreur suppression"); }
      }
  };

  // --- COLONNES ---
  const columns = [
    { 
        field: 'date', 
        headerName: 'Date', 
        width: 130,
        renderCell: (params) => {
            // 🔍 INSPECTION : On cherche la date dans plusieurs champs possibles (maj/min/created)
            const rawDate = params.row.date || params.row.Date || params.row.createdAt || params.row.CreatedAt;

            // Si aucune date trouvée
            if (!rawDate) return <Typography variant="body2" color="textSecondary">-</Typography>;

            // Conversion sécurisée
            const dateObj = new Date(rawDate);

            // Vérification de validité
            if (isNaN(dateObj.getTime())) {
                return <Typography variant="caption" color="error">Date Erreur</Typography>;
            }

            // Affichage propre (ex: 28/12/2025)
            return (
                <Typography variant="body2">
                    {dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Typography>
            );
        }
    },
    { 
        field: 'description', headerName: 'Description', flex: 1, minWidth: 200,
        renderCell: (params) => (
            <Typography variant="body2" fontWeight="500">{params.value}</Typography>
        )
    },
    { 
        field: 'category', headerName: 'Catégorie', width: 180,
        renderCell: (params) => {
            const catName = params.row.category?.name || 'Non classé';
            return (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ p: 0.5, bgcolor: '#f5f5f5', borderRadius: 1, color: '#666', display: 'flex' }}>
                        {getCategoryIcon(catName)}
                    </Box>
                    <Typography variant="body2">{catName}</Typography>
                </Stack>
            );
        }
    },
    { 
        field: 'account', headerName: 'Compte', width: 150,
        renderCell: (params) => (
            <Chip label={params.row.account?.name || '-'} size="small" variant="outlined" />
        )
    },
    { 
        field: 'type', headerName: 'Type', width: 120,
        renderCell: (params) => (
            <Chip 
                label={params.value} 
                size="small" 
                color={params.value === 'Revenu' || params.value === 'Income' ? 'success' : 'error'} 
            />
        )
    },
    { 
        field: 'amount', headerName: 'Montant', width: 140, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            const isExpense = params.row.type === 'Dépense' || params.row.type === 'Expense';
            const val = parseFloat(params.value); 
            return (
                <Typography fontWeight="bold" sx={{ color: isExpense ? 'error.main' : 'success.main' }}>
                    {isExpense ? '-' : '+'} {Math.abs(val).toLocaleString()} MAD
                </Typography>
            );
        }
    },
    {
        field: 'actions', headerName: 'Actions', width: 120, align: 'center', sortable: false,
        renderCell: (params) => (
            <Stack direction="row" spacing={1}>
                {/* 🛠️ CORRECTION BOUTONS : Visible directement */}
                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(params.row)}>
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                    <Delete fontSize="small" />
                </IconButton>
            </Stack>
        )
    }
  ];

  // Données graphiques fictives (pour l'exemple visuel)
  const chartData = [
      { name: 'Lun', amt: 400 }, { name: 'Mar', amt: -200 }, { name: 'Mer', amt: 500 }, 
      { name: 'Jeu', amt: -100 }, { name: 'Ven', amt: -50 }, { name: 'Sam', amt: -300 }, { name: 'Dim', amt: 0 }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 0.5 }}>Mes Transactions</Typography>
            <Typography variant="body2" color="textSecondary">Gérez vos flux financiers</Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => handleOpenDialog()}
            sx={{ 
                borderRadius: 2, px: 3, py: 1, 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 15px rgba(33, 203, 243, .3)'
            }}
        >
            Nouvelle Transaction
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Solde" amount={`${stats.balance.toLocaleString()} MAD`} icon={<AccountBalanceWallet />} color="primary" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Revenus" amount={`${stats.income.toLocaleString()} MAD`} icon={<TrendingUp />} color="success" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard title="Dépenses" amount={`${stats.expense.toLocaleString()} MAD`} icon={<TrendingDown />} color="error" />
                </Grid>
            </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ height: '100%', p: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="textSecondary">TENDANCE SEMAINE</Typography>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={chartData}>
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="amt" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.amt > 0 ? '#4caf50' : '#f44336'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      {/* Barre de recherche */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField 
                placeholder="Rechercher..." 
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
            />
            <Button variant="outlined" startIcon={<FilterList />}>Filtres</Button>
            <Button variant="outlined" startIcon={<Download />}>Export</Button>
        </Stack>
      </Paper>

      {/* Tableau DataGrid */}
      <Paper sx={{ height: 600, width: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <DataGrid
            loading={loading}
            rows={transactions.filter(t => 
                t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8f9fa', color: '#6c757d', fontWeight: 700 },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5fbfd' },
                '& .MuiDataGrid-cell:focus': { outline: 'none' }
            }}
        />
      </Paper>

      {/* MODALE (DIALOG) AJOUT / MODIF */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
          <DialogContent dividers>
              <TextField 
                  label="Description" fullWidth margin="normal" 
                  value={currentTransaction.description} 
                  onChange={(e) => setCurrentTransaction({...currentTransaction, description: e.target.value})} 
              />
              <Grid container spacing={2}>
                  <Grid item xs={6}>
                      <TextField 
                          label="Montant" type="number" fullWidth margin="normal"
                          value={currentTransaction.amount}
                          onChange={(e) => setCurrentTransaction({...currentTransaction, amount: e.target.value})}
                          InputProps={{ endAdornment: <InputAdornment position="end">MAD</InputAdornment> }}
                      />
                  </Grid>
                  <Grid item xs={6}>
                      <TextField 
                          label="Date" type="date" fullWidth margin="normal"
                          value={currentTransaction.date}
                          onChange={(e) => setCurrentTransaction({...currentTransaction, date: e.target.value})}
                      />
                  </Grid>
              </Grid>
              <Grid container spacing={2}>
                  <Grid item xs={6}>
                      <TextField 
                          select label="Type" fullWidth margin="normal"
                          value={currentTransaction.type}
                          onChange={(e) => setCurrentTransaction({...currentTransaction, type: e.target.value})}
                      >
                          <MenuItem value="Dépense">Dépense</MenuItem>
                          <MenuItem value="Revenu">Revenu</MenuItem>
                      </TextField>
                  </Grid>
                  <Grid item xs={6}>
                      <TextField 
                          select label="Compte" fullWidth margin="normal"
                          value={currentTransaction.accountId}
                          onChange={(e) => setCurrentTransaction({...currentTransaction, accountId: e.target.value})}
                      >
                          {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
                      </TextField>
                  </Grid>
              </Grid>
              <TextField 
                  select label="Catégorie" fullWidth margin="normal"
                  value={currentTransaction.categoryId || ''}
                  onChange={(e) => setCurrentTransaction({...currentTransaction, categoryId: e.target.value})}
              >
                  <MenuItem value="">Aucune</MenuItem>
                  {categories
                    .filter(c => {
                        // Filtrer les catégories par type si besoin, ou tout afficher
                        const type = currentTransaction.type.toLowerCase();
                        const catType = (c.type || '').toLowerCase();
                        if(type.includes('revenu')) return catType.includes('revenu') || catType.includes('income');
                        return catType.includes('dépense') || catType.includes('expense') || catType.includes('depense');
                    })
                    .map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDialog(false)} color="inherit">Annuler</Button>
              <Button onClick={handleSave} variant="contained" color="primary">Enregistrer</Button>
          </DialogActions>
      </Dialog>

    </Box>
  );
}