import { useState, useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Paper, Typography, Chip, IconButton, Box, Grid, Card, CardContent, 
  Drawer, Avatar, Divider, LinearProgress, TextField, InputAdornment, 
  Button, Tooltip, MenuItem, Alert 
} from '@mui/material';
import { 
  ReceiptLong, Search, FilterList, Visibility, Flag, CheckCircle, 
  AttachMoney, TrendingDown, TrendingUp, CalendarToday, Clear
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import api from '../../services/api';

// --- 1. SOUS-COMPOSANT : ANALYTICS (GRAPHIQUES) ---
const TransactionAnalytics = ({ stats }) => {
  if (!stats) return <LinearProgress />;

  // Sécurisation des données pour éviter les crashs si null
  const trendData = stats.trend || []; 
  const totalVolume = stats.totalVolume || 0;
  const todayCount = stats.todayCount || 0;
  const highValue = stats.highValue || 0;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* KPI 1 : Volume Total */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', bgcolor: '#e3f2fd', border: '1px solid #bbdefb', boxShadow: 0 }}>
          <CardContent>
            <Typography color="textSecondary" variant="caption" fontWeight="bold">VOLUME TOTAL</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <AttachMoney color="primary" fontSize="large"/>
              <Typography variant="h5" fontWeight="bold">
                {totalVolume.toLocaleString()} <Typography component="span" variant="caption">MAD</Typography>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* KPI 2 : Transactions Aujourd'hui */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', bgcolor: '#f3e5f5', border: '1px solid #e1bee7', boxShadow: 0 }}>
          <CardContent>
            <Typography color="textSecondary" variant="caption" fontWeight="bold">AUJOURD'HUI</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <ReceiptLong color="secondary" fontSize="large"/>
              <Typography variant="h4" fontWeight="bold">{todayCount}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* KPI 3 : Transactions à Valeur Élevée */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', bgcolor: '#fff3e0', border: '1px solid #ffe0b2', boxShadow: 0 }}>
          <CardContent>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>HAUTE VALEUR ({'>'}5k)</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Flag color="warning" fontSize="large"/>
              <Typography variant="h4" fontWeight="bold">{highValue}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* CHART : Flux Entrées/Sorties */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', boxShadow: 0, border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 2, pb: 0, height: '100%' }}>
            <Typography variant="caption" fontWeight="bold">FLUX (30J)</Typography>
            <Box sx={{ height: 100, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f44336" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip contentStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="income" stroke="#4caf50" fill="url(#colorInc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#f44336" fill="url(#colorExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// --- 2. COMPOSANT PRINCIPAL ---
const AdminTransactions = () => {
  // États des données
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // États de l'interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Recherche
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ search: '', type: 'All', minAmount: '' });
  
  // Référence pour le debounce (anti-rebond de recherche)
  const searchTimeoutRef = useRef(null);

  // Drawer (Volet latéral d'audit)
  const [selectedTx, setSelectedTx] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 1. Charger les Analytics au montage
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // 2. Charger les Transactions quand la pagination ou les filtres changent
  useEffect(() => {
    fetchTransactions();
  }, [paginationModel, filters.type]); // On recharge si page ou type change

  // 3. Gestion de la recherche texte (Debounce)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset à la page 1 lors d'une recherche
      fetchTransactions();
    }, 500); // Attendre 500ms après la frappe

    return () => clearTimeout(searchTimeoutRef.current);
  }, [filters.search, filters.minAmount]);

  // --- APPELS API ---

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/transactions/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Erreur analytics:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/transactions', {
        params: {
          page: paginationModel.page + 1, // API est souvent en base 1
          pageSize: paginationModel.pageSize,
          search: filters.search || null,
          type: filters.type !== 'All' ? filters.type : null,
          minAmount: filters.minAmount || null
        }
      });
      
      // Adaptation robuste aux différents formats de réponse possibles
      setTransactions(response.data.items || response.data.data || []);
      setTotalCount(response.data.totalCount || response.data.total || 0);
    } catch (err) {
      console.error('Erreur transactions:', err);
      setError('Impossible de charger les transactions. Vérifiez la connexion.');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleOpenDrawer = (tx) => {
    setSelectedTx(tx);
    setDrawerOpen(true);
  };

  const handleFilterChange = (prop) => (event) => {
    setFilters({ ...filters, [prop]: event.target.value });
  };

  const handleValidateTx = () => {
    // Ici vous pourriez appeler une API pour valider la transaction
    alert(`Transaction #${selectedTx.id} validée par l'admin.`);
    setDrawerOpen(false);
  };

  // --- COLONNES DATAGRID ---
  const columns = [
    { field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center' },
    {
      field: 'userName',
      headerName: 'Utilisateur',
      width: 200,
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.userEmail}</Typography>
        </Box>
      )
    },
    { field: 'description', headerName: 'Description', width: 200, flex: 1 },
    {
      field: 'amount',
      headerName: 'Montant',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color={params.row.type === 'Revenu' ? 'success.main' : 'error.main'}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}
        >
          {params.row.type === 'Revenu' ? <TrendingUp fontSize="small"/> : <TrendingDown fontSize="small"/>}
          {params.value ? Math.abs(params.value).toLocaleString() : '0'} MAD
        </Typography>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Revenu' ? 'success' : 'error'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => new Date(params).toLocaleDateString('fr-FR')
    },
    {
      field: 'actions',
      headerName: 'Audit',
      width: 100,
      align: 'center',
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handleOpenDrawer(params.row)}
          startIcon={<Visibility />}
          sx={{ textTransform: 'none' }}
        >
          Détails
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        🧾 Audit des Transactions
      </Typography>

      {/* 1. SECTION ANALYTICS */}
      <TransactionAnalytics stats={analytics} />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* 2. BARRE D'OUTILS (Recherche Serveur) */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Rechercher (Utilisateur, Description)..."
          value={filters.search}
          onChange={handleFilterChange('search')}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 250 }}
        />
        
        <TextField
          select size="small" label="Type"
          value={filters.type} onChange={handleFilterChange('type')}
          sx={{ width: 150 }}
        >
          <MenuItem value="All">Tous</MenuItem>
          <MenuItem value="Revenu">Revenus</MenuItem>
          <MenuItem value="Dépense">Dépenses</MenuItem>
        </TextField>

        <TextField
          size="small" label="Min Montant" type="number"
          value={filters.minAmount} onChange={handleFilterChange('minAmount')}
          sx={{ width: 150 }}
        />
      </Paper>

      {/* 3. TABLEAU */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          rowCount={totalCount}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          paginationMode="server" // 👈 INDISPENSABLE : La pagination est gérée par l'API
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
          }}
        />
      </Paper>

      {/* 4. DRAWER D'AUDIT (Détails Latéraux) */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 450, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {selectedTx && (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                 <Typography variant="h6" fontWeight="bold">🔍 Transaction #{selectedTx.id}</Typography>
                 <IconButton onClick={() => setDrawerOpen(false)}><Clear /></IconButton>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {/* Info Utilisateur */}
              <Box display="flex" alignItems="center" gap={2} mb={3} p={2} bgcolor="#f5f5f5" borderRadius={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{selectedTx.userName?.charAt(0).toUpperCase()}</Avatar>
                <Box>
                    <Typography variant="subtitle2">{selectedTx.userName}</Typography>
                    <Typography variant="caption" color="textSecondary">{selectedTx.userEmail}</Typography>
                </Box>
              </Box>

              {/* Info Financières */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">MONTANT</Typography>
                    <Typography variant="h5" fontWeight="bold" color={selectedTx.type === 'Revenu' ? 'success.main' : 'error.main'}>
                        {selectedTx.amount?.toLocaleString()} MAD
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">DATE</Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <CalendarToday fontSize="small" color="action"/>
                        <Typography variant="body1">{new Date(selectedTx.date).toLocaleDateString()}</Typography>
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">DESCRIPTION</Typography>
                    <Typography variant="body1">{selectedTx.description || "Aucune description"}</Typography>
                </Grid>
              </Grid>

              {/* Reçu (Factice pour l'instant ou réel si receiptPath existe) */}
              <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>JUSTIFICATIF</Typography>
              <Box 
                sx={{ 
                    flexGrow: 1, bgcolor: '#fafafa', border: '2px dashed #e0e0e0', borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
                }}
              >
                {selectedTx.receiptPath ? (
                    <img src={`http://localhost:5161/${selectedTx.receiptPath}`} alt="Reçu" style={{maxWidth: '100%', maxHeight: '300px'}} />
                ) : (
                    <Box textAlign="center" color="textSecondary">
                        <ReceiptLong fontSize="large" sx={{ opacity: 0.2 }} />
                        <Typography variant="body2">Aucun reçu joint</Typography>
                    </Box>
                )}
              </Box>

              <Box mt="auto">
                <Button variant="contained" color="success" fullWidth startIcon={<CheckCircle />} onClick={handleValidateTx}>
                    Valider la transaction
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default AdminTransactions;