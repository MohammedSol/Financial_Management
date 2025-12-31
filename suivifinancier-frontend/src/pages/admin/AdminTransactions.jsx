
import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Drawer,
  IconButton,
  Divider,
  Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A020F0', '#FF6384'];

const AdminTransactions = () => {
  // --- State ---
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', category: '' });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [totalCount, setTotalCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // --- Load analytics ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/admin/transactions/analytics');
        setAnalytics(res.data);
      } catch (err) {
        setError('Erreur lors du chargement des analytics');
      }
    };
    fetchAnalytics();
  }, []);

  // --- Load transactions ---
  const loadTransactions = async (page = 1, pageSize = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/transactions', {
        params: { page, pageSize, ...filters, search }
      });
      setTransactions(response.data.data);
      setTotalCount(response.data.totalCount);
    } catch (err) {
      setError('Impossible de charger les transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(paginationModel.page + 1, paginationModel.pageSize);
    // eslint-disable-next-line
  }, [paginationModel, filters, search]);

  // --- Columns ---
  const columns = [
    {
      field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center'
    },
    {
      field: 'userName', headerName: 'Utilisateur', width: 180, flex: 1,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.userEmail}</Typography>
        </Box>
      )
    },
    {
      field: 'description', headerName: 'Description', width: 200, flex: 1
    },
    {
      field: 'type', headerName: 'Type', width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'Income' ? <IncomeIcon /> : <ExpenseIcon />}
          label={params.value === 'Income' ? 'Revenu' : 'Dépense'}
          color={params.value === 'Income' ? 'success' : 'error'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'amount', headerName: 'Montant', width: 130, align: 'right', headerAlign: 'right',
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color={params.row.type === 'Income' ? 'success.main' : 'error.main'}
        >
          {params.row.type === 'Income' ? '+' : '-'}
          {Math.abs(params.value).toFixed(2)} MAD
        </Typography>
      )
    },
    {
      field: 'categoryName', headerName: 'Catégorie', width: 150, renderCell: (params) => params.value || '-'
    },
    {
      field: 'accountName', headerName: 'Compte', width: 150, renderCell: (params) => params.value || '-'
    },
    {
      field: 'date', headerName: 'Date Transaction', width: 130,
      valueFormatter: (params) => new Date(params).toLocaleDateString('fr-FR')
    },
    {
      field: 'createdAt', headerName: 'Date Création', width: 150,
      valueFormatter: (params) => new Date(params).toLocaleString('fr-FR')
    }
  ];

  // --- Handlers ---
  const handleRowClick = (params) => {
    setSelectedTransaction(params.row);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedTransaction(null);
  };

  // --- UI ---
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Transactions Système
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* --- ZONE 1 : ANALYTICS --- */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
            <Typography variant="h5" fontWeight={600}>{analytics?.totalTransactions ?? '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Volume Total</Typography>
            <Typography variant="h5" fontWeight={600} color="primary">{analytics ? analytics.totalVolume.toFixed(2) : '-'} MAD</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Utilisateurs Uniques</Typography>
            <Typography variant="h5" fontWeight={600}>{analytics?.uniqueUsers ?? '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Catégories</Typography>
            <Typography variant="h5" fontWeight={600}>{analytics?.categoriesCount ?? '-'}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}><BarChartIcon fontSize="small" sx={{ mr: 1 }} />Transactions 30j</Typography>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics?.trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey={x => new Date(x.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => value} labelFormatter={label => label} />
                <Bar dataKey="count" fill="#1976d2" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}><PieChartIcon fontSize="small" sx={{ mr: 1 }} />Par Type</Typography>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={analytics?.typeDistribution || []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} label>
                  {(analytics?.typeDistribution || []).map((entry, idx) => (
                    <Cell key={`cell-type-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}><PieChartIcon fontSize="small" sx={{ mr: 1 }} />Top Catégories</Typography>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={analytics?.categoryDistribution || []} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={60} label>
                  {(Array.isArray(analytics?.categoryDistribution) ? analytics.categoryDistribution : []).map((entry, idx) => (
                    <Cell key={`cell-cat-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </Paper>

      {/* --- ZONE 2 : FILTRES AVANCÉS --- */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Recherche globale"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom, email, description..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ flex: 2 }}
        />
        <TextField
          label="Type"
          select
          SelectProps={{ native: true }}
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          sx={{ flex: 1 }}
        >
          <option value="">Tous</option>
          <option value="Income">Revenu</option>
          <option value="Expense">Dépense</option>
        </TextField>
        <TextField
          label="Catégorie"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          placeholder="Catégorie..."
          sx={{ flex: 1 }}
        />
      </Paper>

      {/* --- ZONE 3 : DATAGRID + DRAWER --- */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          rowCount={totalCount}
          paginationMode="server"
          loading={loading}
          disableSelectionOnClick
          getRowHeight={() => 'auto'}
          onRowClick={handleRowClick}
          sx={{
            '& .MuiDataGrid-cell': { py: 1 },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
          }}
        />
      </Paper>

      {/* --- DRAWER AUDIT --- */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose} PaperProps={{ sx: { width: 400 } }}>
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>Audit Transaction</Typography>
            <IconButton onClick={handleDrawerClose}><CloseIcon /></IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {selectedTransaction ? (
            <>
              <Typography variant="subtitle2" color="text.secondary">ID: {selectedTransaction.id}</Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>{selectedTransaction.description}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selectedTransaction.userName} ({selectedTransaction.userEmail})</Typography>
              <Chip
                icon={selectedTransaction.type === 'Income' ? <IncomeIcon /> : <ExpenseIcon />}
                label={selectedTransaction.type === 'Income' ? 'Revenu' : 'Dépense'}
                color={selectedTransaction.type === 'Income' ? 'success' : 'error'}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="h6" color={selectedTransaction.type === 'Income' ? 'success.main' : 'error.main'}>
                {selectedTransaction.type === 'Income' ? '+' : '-'}{Math.abs(selectedTransaction.amount).toFixed(2)} MAD
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">Catégorie : <b>{selectedTransaction.categoryName || '-'}</b></Typography>
              <Typography variant="body2">Compte : <b>{selectedTransaction.accountName || '-'}</b></Typography>
              <Typography variant="body2">Date transaction : <b>{new Date(selectedTransaction.date).toLocaleDateString('fr-FR')}</b></Typography>
              <Typography variant="body2">Créée le : <b>{new Date(selectedTransaction.createdAt).toLocaleString('fr-FR')}</b></Typography>
            </>
          ) : (
            <Typography color="text.secondary">Aucune transaction sélectionnée</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default AdminTransactions;
