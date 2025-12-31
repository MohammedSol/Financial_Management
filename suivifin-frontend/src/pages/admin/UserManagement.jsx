import { useState, useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Paper, Typography, Chip, IconButton, Box, Grid, Card, CardContent, 
  Drawer, Avatar, Divider, List, ListItem, ListItemText, LinearProgress,
  TextField, InputAdornment, Menu, MenuItem, Tooltip, Alert, Button
} from '@mui/material';
import { 
  Block, CheckCircle, Visibility, TrendingUp, Group, PersonOff, 
  Search, MoreVert, Circle as CircleIcon, Delete
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { HubConnectionBuilder } from '@microsoft/signalr'; // Assurez-vous d'installer: npm install @microsoft/signalr
import api from '../../services/api';

// --- 1. COMPOSANT ANALYTICS (VISUALISATION) ---
const UserAnalytics = ({ stats }) => {
  if (!stats) return <LinearProgress />;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* KPI 1 : Total */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', bgcolor: '#e3f2fd', boxShadow: 0, border: '1px solid #bbdefb' }}>
          <CardContent>
            <Typography color="textSecondary" variant="caption" fontWeight="bold">UTILISATEURS TOTAUX</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Group color="primary" fontSize="large"/>
              <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* KPI 2 : Actifs */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', bgcolor: '#e8f5e9', boxShadow: 0, border: '1px solid #c8e6c9' }}>
          <CardContent>
            <Typography color="textSecondary" variant="caption" fontWeight="bold">ACTIFS (30J)</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <TrendingUp color="success" fontSize="large"/>
              <Typography variant="h4" fontWeight="bold">{stats.active}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* KPI 3 : Bannis */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', bgcolor: '#ffebee', boxShadow: 0, border: '1px solid #ffcdd2' }}>
          <CardContent>
            <Typography color="textSecondary" variant="caption" fontWeight="bold">UTILISATEURS BANNIS</Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Block color="error" fontSize="large"/>
              <Typography variant="h4" fontWeight="bold">{stats.banned}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* CHART : Tendance Inscriptions */}
      <Grid item xs={12} md={3}>
        <Card sx={{ height: '100%', boxShadow: 0, border: '1px solid #e0e0e0' }}>
          <CardContent sx={{ p: 2, pb: 0, height: '100%' }}>
            <Typography variant="caption" fontWeight="bold">INSCRIPTIONS (30J)</Typography>
            <Box sx={{ height: 80, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <RechartsTooltip contentStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
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
export default function UserManagement() {
  // --- États ---
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination & Recherche
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);

  // SignalR (En ligne / Hors ligne)
  const [onlineUsers, setOnlineUsers] = useState({});

  // Actions (Drawer & Menu)
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // Pour le menu contextuel

  // --- Initialisation ---
  useEffect(() => {
    fetchAnalytics();
    initializeSignalR();
    // Cleanup SignalR on unmount logic here if needed
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [paginationModel]);

  // Recherche avec "Debounce" (attendre que l'utilisateur finisse de taper)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page
      fetchUsers();
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  // --- API Calls ---
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/users/analytics');
      setAnalytics(res.data);
    } catch (e) { console.error('Erreur analytics:', e); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          page: paginationModel.page + 1,
          pageSize: paginationModel.pageSize,
          search: searchTerm || null
        }
      });
      // Adaptation selon format retourné par votre API
      setUsers(res.data.data || res.data.items || []); 
      setRowCount(res.data.total || res.data.totalCount || 0);
    } catch (e) { 
      console.error(e); 
      setError('Impossible de charger les utilisateurs');
    }
    setLoading(false);
  };

  const fetchUserDetails = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}/details`);
      setUserDetails(res.data);
    } catch (e) { console.error('Erreur détails:', e); }
  };

  // --- SignalR Logic ---
  const initializeSignalR = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5161/notificationHub', { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();

      connection.on('UserStatusChanged', (userId, isOnline) => {
        setOnlineUsers(prev => ({ ...prev, [userId]: isOnline }));
      });

      await connection.start();
      console.log('✅ SignalR Connecté');
      
      // Charger état initial (si API disponible)
      try {
          const res = await api.get('/admin/users/online');
          const map = {};
          res.data.forEach(id => map[id] = true);
          setOnlineUsers(map);
      } catch(e) { /* API optionnelle */ }

    } catch (err) { console.error('SignalR Erreur:', err); }
  };

  // --- Handlers ---
  const handleOpenDrawer = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
    setUserDetails(null); // Reset
    fetchUserDetails(user.id);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/admin/users/${selectedUser.id}/lock`);
      alert(`Statut de ${selectedUser.name} mis à jour.`);
      fetchUsers();
      fetchAnalytics();
    } catch (e) { alert('Erreur lors de l\'opération'); }
    handleMenuClose();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !window.confirm("Êtes-vous sûr de vouloir SUPPRIMER cet utilisateur ?")) return;
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      fetchUsers();
    } catch(e) { alert('Erreur suppression'); }
    handleMenuClose();
  };

  // --- Colonnes DataGrid ---
  const columns = [
    { 
      field: 'avatar', headerName: '', width: 60, sortable: false,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: params.row.role === 'Admin' ? '#1976d2' : '#ed6c02', width: 32, height: 32, fontSize: 14 }}>
          {params.row.name?.substring(0,2).toUpperCase()}
        </Avatar>
      )
    },
    {
        field: 'status', headerName: '', width: 50,
        renderCell: (params) => (
            <Tooltip title={onlineUsers[params.row.id] ? "En Ligne" : "Hors Ligne"}>
                <CircleIcon sx={{ color: onlineUsers[params.row.id] ? '#4caf50' : '#e0e0e0', fontSize: 12 }} />
            </Tooltip>
        )
    },
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { 
      field: 'role', headerName: 'Rôle', width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          variant={params.value === 'Admin' ? 'filled' : 'outlined'} 
          color="primary" 
        />
      )
    },
    { 
      field: 'isLocked', headerName: 'Statut', width: 120,
      renderCell: (params) => (
         params.value 
         ? <Chip label="Banni" color="error" size="small" icon={<Block />} />
         : <Chip label="Actif" color="success" size="small" icon={<CheckCircle />} variant="outlined" />
      )
    },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false, align: 'right',
      renderCell: (params) => (
        <Box>
            <IconButton onClick={() => handleOpenDrawer(params.row)} color="primary" size="small">
                <Visibility />
            </IconButton>
            <IconButton onClick={(e) => handleMenuOpen(e, params.row)} size="small">
                <MoreVert />
            </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
         👥 Gestion des Utilisateurs
      </Typography>
      
      {/* 1. SECTION VISUELLE */}
      <UserAnalytics stats={analytics} />

      {/* 2. BARRE D'OUTILS (Recherche) */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
            size="small"
            placeholder="Rechercher (Nom, Email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            }}
            sx={{ width: 300 }}
        />
        <Box flexGrow={1} />
        <Button variant="contained" startIcon={<PersonOff />} color="warning" onClick={() => alert("Fonction export à venir")}>
            Export CSV
        </Button>
      </Paper>

      {/* 3. GRILLE DE DONNÉES */}
      <Paper sx={{ height: 600, width: '100%', border: 'none', boxShadow: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <DataGrid
          rows={users}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          paginationMode="server"
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      {/* 4. DRAWER (Fiche Détail Latérale) */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 400, p: 3 }}>
          {selectedUser && (
            <>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mb: 2, fontSize: 32 }}>
                  {selectedUser.name?.substring(0,1)}
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{selectedUser.name}</Typography>
                <Typography color="textSecondary" gutterBottom>{selectedUser.email}</Typography>
                
                <Box display="flex" gap={1} mt={1}>
                    <Chip 
                        label={onlineUsers[selectedUser.id] ? "🟢 En Ligne" : "⚫ Hors Ligne"} 
                        variant="outlined" 
                        size="small" 
                    />
                    <Chip label={selectedUser.role} color="primary" size="small" />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* KPIs Utilisateur */}
              {userDetails ? (
                <>
                  <Typography variant="h6" gutterBottom>📊 Performance</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5', boxShadow: 0 }}>
                        <Typography variant="h6" color="primary">{userDetails.accountsCount || 0}</Typography>
                        <Typography variant="caption">Comptes</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5', boxShadow: 0 }}>
                        <Typography variant="h6" color="primary">{(userDetails.totalVolume || 0).toLocaleString()} MAD</Typography>
                        <Typography variant="caption">Volume</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom>🕒 Dernières Activités</Typography>
                  <List dense>
                    {userDetails.lastTransactions?.length > 0 ? (
                      userDetails.lastTransactions.map((t) => (
                        <ListItem key={t.id} divider>
                          <ListItemText 
                            primary={t.description || 'Transaction'} 
                            secondary={new Date(t.date).toLocaleDateString()}
                          />
                          <Chip 
                            label={`${t.type === 'Revenu' ? '+' : '-'}${t.amount} MAD`} 
                            size="small" 
                            color={t.type === 'Revenu' ? 'success' : 'error'} 
                            variant="outlined"
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">Aucune activité récente.</Typography>
                    )}
                  </List>
                </>
              ) : (
                <Box py={5} display="flex" justifyContent="center"><LinearProgress sx={{ width: '50%' }} /></Box>
              )}

              <Box mt="auto" pt={5}>
                <Typography variant="caption" color="error" fontWeight="bold">ZONE ADMINISTRATIVE</Typography>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    color={selectedUser.isLocked ? "success" : "error"} 
                    startIcon={<Block />} 
                    sx={{ mt: 1 }}
                    onClick={handleBanUser}
                >
                    {selectedUser.isLocked ? "Débloquer l'utilisateur" : "Bannir l'utilisateur"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      {/* 5. MENU CONTEXTUEL */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpenDrawer} disabled>
            <Visibility fontSize="small" sx={{ mr: 1 }} /> Voir Détails (Ouvrir Drawer)
        </MenuItem>
        <MenuItem onClick={handleBanUser} sx={{ color: 'warning.main' }}>
            <Block fontSize="small" sx={{ mr: 1 }} /> {selectedUser?.isLocked ? "Débloquer" : "Bannir"}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Supprimer
        </MenuItem>
      </Menu>

    </Box>
  );
}