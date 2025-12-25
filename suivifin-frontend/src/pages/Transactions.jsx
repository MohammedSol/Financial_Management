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
  Chip,
  MenuItem,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PsychologyIcon from '@mui/icons-material/Psychology';
import api from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Dépense',
    categoryId: '',
    accountId: ''
  });
  const [error, setError] = useState('');
  const [mlSuggestion, setMlSuggestion] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    accountId: ''
  });

  // Fonction pour normaliser les types (gérer les différentes variations)
  const normalizeType = (type) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('expense') || lowerType.includes('depense') || lowerType.includes('dépense')) {
      return 'expense';
    }
    if (lowerType.includes('income') || lowerType.includes('revenu')) {
      return 'income';
    }
    return lowerType;
  };

  // Fonction pour filtrer les catégories selon le type de transaction
  const getFilteredCategories = (transactionType) => {
    const normalized = normalizeType(transactionType);
    return categories.filter(c => normalizeType(c.type) === normalized);
  };

  useEffect(() => {
    loadTransactions();
    loadAccounts();
    loadCategories();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des transactions');
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error('Erreur chargement comptes');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      console.log('✅ Catégories chargées:', response.data);
      console.log('📊 Types de catégories uniques:', [...new Set(response.data.map(c => c.type))]);
      setCategories(response.data);
    } catch (err) {
      console.error('❌ Erreur chargement catégories:', err.response?.data || err.message);
      setError('Erreur lors du chargement des catégories');
    }
  };

  const handleOpenDialog = (transaction = null) => {
    if (transaction) {
      setCurrentTransaction({
        ...transaction,
        date: new Date(transaction.date).toISOString().split('T')[0]
      });
      setEditMode(true);
    } else {
      setCurrentTransaction({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'Dépense',
        categoryId: '',
        accountId: ''
      });
      setEditMode(false);
    }
    console.log('📝 Ouverture dialog, catégories disponibles:', categories.length);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setMlSuggestion(null);
  };

  const handleSuggestCategory = async () => {
    if (!currentTransaction.description || currentTransaction.description.trim() === '') {
      setError('Veuillez entrer une description pour obtenir une suggestion');
      return;
    }

    try {
      const response = await api.get(`/transactions/suggest-category?description=${encodeURIComponent(currentTransaction.description)}`);
      console.log('🤖 Suggestion ML reçue:', response.data);
      setMlSuggestion(response.data);
      
      // Appliquer automatiquement la suggestion si une catégorie est trouvée
      if (response.data.categoryId) {
        console.log('✅ Application de la catégorie:', response.data.categoryId, response.data.categoryName);
        setCurrentTransaction({
          ...currentTransaction,
          categoryId: response.data.categoryId.toString() // Convertir en string pour le select
        });
      } else {
        setError(`Catégorie "${response.data.categoryName}" suggérée mais non trouvée. Créez-la d'abord.`);
      }
      
    } catch (err) {
      console.error('❌ Erreur ML:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur lors de la suggestion ML. Le modèle doit être entraîné d\'abord.');
    }
  };

  const handleSave = async () => {
    try {
      // Valider les champs requis
      if (!currentTransaction.amount || parseFloat(currentTransaction.amount) <= 0) {
        setError('Le montant doit être supérieur à 0');
        return;
      }
      if (!currentTransaction.categoryId) {
        setError('Veuillez sélectionner une catégorie');
        return;
      }
      if (!currentTransaction.accountId) {
        setError('Veuillez sélectionner un compte');
        return;
      }
      
      // Convertir au bon format pour le backend
      const transactionData = {
        description: currentTransaction.description,
        amount: parseFloat(currentTransaction.amount),
        date: new Date(currentTransaction.date + 'T00:00:00').toISOString(), // Format ISO complet
        type: currentTransaction.type,
        categoryId: parseInt(currentTransaction.categoryId),
        accountId: parseInt(currentTransaction.accountId)
      };
      
      console.log('📤 Envoi transaction:', transactionData);
      
      if (editMode) {
        transactionData.id = currentTransaction.id;
        await api.put(`/transactions/${currentTransaction.id}`, transactionData);
      } else {
        await api.post('/transactions', transactionData);
      }
      loadTransactions();
      loadAccounts(); // Recharger pour mettre à jour les soldes
      handleCloseDialog();
    } catch (err) {
      console.error('❌ Erreur complète:', err);
      console.error('❌ Erreur response:', err.response);
      console.error('❌ Erreur data:', err.response?.data);
      console.error('❌ Erreur status:', err.response?.status);
      setError(err.response?.data?.message || err.response?.data?.title || err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await api.delete(`/transactions/${id}`);
        loadTransactions();
        loadAccounts();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filters.type && t.type !== filters.type) return false;
    if (filters.categoryId && t.categoryId !== parseInt(filters.categoryId)) return false;
    if (filters.accountId && t.accountId !== parseInt(filters.accountId)) return false;
    return true;
  });

  return (
    <Box sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Transactions
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Transaction
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtres</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="Revenu">Revenu</MenuItem>
              <MenuItem value="Dépense">Dépense</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Compte"
              value={filters.accountId}
              onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            >
              <MenuItem value="">Tous</MenuItem>
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Catégorie"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <MenuItem value="">Toutes</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Compte</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Montant</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.category?.name || '-'}</TableCell>
                <TableCell>{transaction.account?.name || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={transaction.type} 
                    size="small" 
                    color={transaction.type === 'Revenu' ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell align="right" sx={{ color: transaction.type === 'Revenu' ? 'success.main' : 'error.main' }}>
                  {transaction.type === 'Revenu' ? '+' : '-'}{transaction.amount.toFixed(2)} MAD
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpenDialog(transaction)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(transaction.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucune transaction trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Description"
            value={currentTransaction.description}
            onChange={(e) => setCurrentTransaction({ ...currentTransaction, description: e.target.value })}
            margin="normal"
            required
          />
          
          {/* Bouton de suggestion ML */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PsychologyIcon />}
              onClick={handleSuggestCategory}
              size="small"
              disabled={!currentTransaction.description}
            >
              Suggérer une catégorie (ML)
            </Button>
            {mlSuggestion && (
              <Chip
                label={`Suggestion: ${mlSuggestion.categoryName}`}
                color={mlSuggestion.categoryId ? 'success' : 'warning'}
                size="small"
              />
            )}
          </Box>

          <TextField
            fullWidth
            label="Montant"
            type="number"
            value={currentTransaction.amount}
            onChange={(e) => setCurrentTransaction({ ...currentTransaction, amount: parseFloat(e.target.value) })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={currentTransaction.date}
            onChange={(e) => setCurrentTransaction({ ...currentTransaction, date: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Type"
            value={currentTransaction.type}
            onChange={(e) => setCurrentTransaction({ ...currentTransaction, type: e.target.value })}
            margin="normal"
          >
            <MenuItem value="Revenu">Revenu</MenuItem>
            <MenuItem value="Dépense">Dépense</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Compte"
            value={currentTransaction.accountId}
            onChange={(e) => setCurrentTransaction({ ...currentTransaction, accountId: e.target.value })}
            margin="normal"
            required
          >
            {accounts.map((acc) => (
              <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Catégorie"
            value={currentTransaction.categoryId || ''}
            onChange={(e) => setCurrentTransaction({ ...currentTransaction, categoryId: e.target.value })}
            margin="normal"
            required
          >
            <MenuItem value="">-- Sélectionner une catégorie --</MenuItem>
            {(() => {
              const filtered = getFilteredCategories(currentTransaction.type);
              console.log('🔍 Type transaction:', currentTransaction.type);
              console.log('🔍 Catégories filtrées:', filtered.length, filtered.map(c => ({ id: c.id, name: c.name, type: c.type })));
              return filtered.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ));
            })()}
          </TextField>
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
