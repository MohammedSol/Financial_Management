import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({
    name: '',
    accountNumber: '',
    currency: 'MAD',
    type: 'Courant',
    balance: 0,
    targetAmount: 0
  });
  const [error, setError] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    loadAccounts();
    loadTotalBalance();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des comptes');
    }
  };

  const loadTotalBalance = async () => {
    try {
      const response = await api.get('/accounts/total-balance');
      setTotalBalance(response.data.totalBalance || 0);
    } catch (err) {
      console.error('Erreur chargement solde total');
    }
  };

  const handleOpenDialog = (account = null) => {
    if (account) {
      setCurrentAccount(account);
      setEditMode(true);
    } else {
      setCurrentAccount({
        name: '',
        accountNumber: '',
        currency: 'MAD',
        type: 'Courant',
        balance: 0,
        targetAmount: 0
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/accounts/${currentAccount.id}`, currentAccount);
      } else {
        await api.post('/accounts', currentAccount);
      }
      loadAccounts();
      loadTotalBalance();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      try {
        await api.delete(`/accounts/${id}`);
        loadAccounts();
        loadTotalBalance();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  return (
    <Box sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Mes Comptes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Compte
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Solde Total
        </Typography>
        <Typography variant="h3" color="primary">
          {totalBalance.toFixed(2)} MAD
        </Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>N° Compte</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Solde</TableCell>
              <TableCell align="right">Objectif</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>{account.accountNumber}</TableCell>
                <TableCell>
                  <Chip label={account.type} size="small" color="primary" />
                </TableCell>
                <TableCell align="right">
                  {account.balance.toFixed(2)} {account.currency}
                </TableCell>
                <TableCell align="right">
                  {account.targetAmount > 0 ? `${account.targetAmount.toFixed(2)} ${account.currency}` : '-'}
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpenDialog(account)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(account.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucun compte trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Modifier le compte' : 'Nouveau compte'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom du compte"
            value={currentAccount.name}
            onChange={(e) => setCurrentAccount({ ...currentAccount, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Numéro de compte"
            value={currentAccount.accountNumber}
            onChange={(e) => setCurrentAccount({ ...currentAccount, accountNumber: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Type"
            value={currentAccount.type}
            onChange={(e) => setCurrentAccount({ ...currentAccount, type: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Devise"
            value={currentAccount.currency}
            onChange={(e) => setCurrentAccount({ ...currentAccount, currency: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Solde initial"
            type="number"
            value={currentAccount.balance}
            onChange={(e) => setCurrentAccount({ ...currentAccount, balance: parseFloat(e.target.value) })}
            margin="normal"
            disabled={editMode}
          />
          <TextField
            fullWidth
            label="Objectif d'épargne"
            type="number"
            value={currentAccount.targetAmount}
            onChange={(e) => setCurrentAccount({ ...currentAccount, targetAmount: parseFloat(e.target.value) })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
