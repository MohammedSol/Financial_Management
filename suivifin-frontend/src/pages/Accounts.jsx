import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Paper, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import AccountCard from '../components/AccountCard';

export default function AccountsPage() {
  const [data, setData] = useState({ accounts: [], totalBalance: 0, allocation: [] });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [currentAccount, setCurrentAccount] = useState({
    name: '', accountNumber: '', currency: 'MAD', type: 'Courant', balance: 0, targetAmount: 0
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/dashboard'); 
      // Sécurité si l'API renvoie null
      setData(res.data || { accounts: [], totalBalance: 0, allocation: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account = null) => {
    if (account) {
      setCurrentAccount(account);
      setEditMode(true);
    } else {
      setCurrentAccount({ name: '', accountNumber: '', currency: 'MAD', type: 'Courant', balance: 0, targetAmount: 0 });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
          ...currentAccount,
          balance: parseFloat(currentAccount.balance),
          targetAmount: parseFloat(currentAccount.targetAmount)
      };

      if (editMode) {
        await api.put(`/accounts/${currentAccount.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }
      setOpenDialog(false);
      loadDashboard(); 
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce compte ?")) {
      try {
        await api.delete(`/accounts/${id}`);
        loadDashboard();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  if (loading && !data.accounts.length) return <Box p={10} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4, maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
            <Typography variant="h4" fontWeight="800">Mon Portefeuille</Typography>
            <Typography color="textSecondary">Vue d'ensemble de vos actifs</Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, px: 3, py: 1.5, background: 'linear-gradient(90deg, #3a7bd5 0%, #3a6073 100%)' }}
        >
            Nouveau Compte
        </Button>
      </Box>

      {/* DASHBOARD TOP */}
      <Grid container spacing={4} mb={4} alignItems="stretch">
        <Grid item xs={12} md={5}>
            <Paper sx={{ p: 4, height: '100%', borderRadius: 4, bgcolor: '#1a237e', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="subtitle1" sx={{ opacity: 0.7, letterSpacing: 1 }}>PATRIMOINE TOTAL</Typography>
                <Typography variant="h2" fontWeight="bold" sx={{ my: 2 }}>
                    {data.totalBalance?.toLocaleString()} <span style={{fontSize: '0.4em'}}>MAD</span>
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>Géré sur {data.accounts?.length || 0} comptes</Typography>
            </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: 280, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Répartition</Typography>
                <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                        <Pie
                            data={data.allocation} cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80} paddingAngle={5}
                            dataKey="value"
                        >
                            {data.allocation?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toLocaleString()} MAD`} />
                        <Legend verticalAlign="middle" align="right" layout="vertical"/>
                    </PieChart>
                </ResponsiveContainer>
            </Paper>
        </Grid>
      </Grid>

      {/* COMPTES GRID */}
      <Typography variant="h5" fontWeight="bold" mb={3}>Mes Comptes</Typography>
      
      {(!data.accounts || data.accounts.length === 0) && (
          <Alert severity="info">Aucun compte. Créez-en un pour commencer !</Alert>
      )}

      <Grid container spacing={3}>
        {data.accounts?.map((acc) => (
            <Grid item xs={12} sm={6} lg={4} key={acc.id}>
                <AccountCard account={acc} onEdit={handleOpenDialog} onDelete={handleDelete} />
            </Grid>
        ))}
      </Grid>

      {/* DIALOG FORMULAIRE */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Modifier le compte' : 'Nouveau compte'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus margin="dense" label="Nom" fullWidth value={currentAccount.name}
            onChange={(e) => setCurrentAccount({...currentAccount, name: e.target.value})}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={6}>
                <TextField select label="Type" fullWidth value={currentAccount.type}
                    onChange={(e) => setCurrentAccount({...currentAccount, type: e.target.value})}
                >
                    <MenuItem value="Courant">Courant</MenuItem>
                    <MenuItem value="Epargne">Epargne</MenuItem>
                    <MenuItem value="Caisse">Caisse</MenuItem>
                </TextField>
             </Grid>
             <Grid item xs={6}>
                <TextField label="Devise" fullWidth value={currentAccount.currency}
                    onChange={(e) => setCurrentAccount({...currentAccount, currency: e.target.value})}
                />
             </Grid>
          </Grid>
          <TextField margin="dense" label="Numéro (Optionnel)" fullWidth sx={{ mt: 2 }}
            value={currentAccount.accountNumber}
            onChange={(e) => setCurrentAccount({...currentAccount, accountNumber: e.target.value})}
          />
          <TextField margin="dense" label="Solde" type="number" fullWidth sx={{ mt: 2 }}
            value={currentAccount.balance}
            onChange={(e) => setCurrentAccount({...currentAccount, balance: e.target.value})}
          />
          {currentAccount.type === 'Epargne' && (
              <TextField margin="dense" label="Objectif" type="number" fullWidth sx={{ mt: 2 }}
                value={currentAccount.targetAmount}
                onChange={(e) => setCurrentAccount({...currentAccount, targetAmount: e.target.value})}
              />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">{editMode ? 'Sauvegarder' : 'Créer'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}