import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  LinearProgress,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';

export default function Budgets() {
  const [budgets, setbudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null); // Pour suivre le budget en cours d'édition
  const [currentBudget, setCurrentBudget] = useState({
    name: '',
    amount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    categoryId: ''
  });
  const [error, setError] = useState('');
  const [budgetProgress, setBudgetProgress] = useState({});

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, []);

  const loadBudgets = async () => {
    try {
      const response = await api.get('/budgets');
      setbudgets(response.data);
      
      // Charger la progression pour chaque budget
      response.data.forEach(async (budget) => {
        try {
          const progressResponse = await api.get(`/budgets/${budget.id}/progress`);
          setBudgetProgress(prev => ({
            ...prev,
            [budget.id]: progressResponse.data
          }));
        } catch (err) {
          console.error(`Erreur chargement progression budget ${budget.id}`);
        }
      });
    } catch (err) {
      setError('Erreur lors du chargement des budgets');
    }
  };

  // Fonction pour normaliser les types de catégories
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

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      // Filtrer uniquement les catégories de dépenses
      setCategories(response.data.filter(c => normalizeType(c.type) === 'expense'));
    } catch (err) {
      console.error('Erreur chargement catégories');
    }
  };

  const handleOpenDialog = () => {
    setEditingBudget(null); // Réinitialiser le mode édition
    setCurrentBudget({
      name: '',
      amount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      categoryId: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
    setError('');
  };

  const handleSave = async () => {
    try {
      if (editingBudget) {
        // Mode édition : utiliser PUT
        await api.put(`/budgets/${editingBudget.id}`, currentBudget);
      } else {
        // Mode création : utiliser POST
        await api.post('/budgets', currentBudget);
      }
      loadBudgets();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  // Nouvelle fonction pour ouvrir le dialogue en mode édition
  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setCurrentBudget({
      name: budget.name,
      amount: budget.amount,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
      categoryId: budget.categoryId
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      try {
        await api.delete(`/budgets/${id}`);
        loadBudgets();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage < 80) return 'success';
    if (percentage < 100) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Budgets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nouveau Budget
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {budgets.map((budget) => {
          const progress = budgetProgress[budget.id] || {
            spent: 0,
            remaining: budget.amount,
            percentageUsed: 0,
            isExceeded: false
          };

          return (
            <Grid item xs={12} md={6} key={budget.id}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{budget.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => handleEdit(budget)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(budget.id)}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Catégorie: {budget.category?.name || '-'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Période: {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                </Typography>

                <Box sx={{ mt: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Dépensé: {progress.spent.toFixed(2)} MAD
                    </Typography>
                    <Typography variant="body2">
                      Budget: {budget.amount.toFixed(2)} MAD
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(progress.percentageUsed, 100)}
                    color={getProgressColor(progress.percentageUsed)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color={progress.isExceeded ? 'error' : 'success.main'}>
                      {progress.isExceeded ? 'Dépassé' : 'Restant'}: {Math.abs(progress.remaining).toFixed(2)} MAD
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {progress.percentageUsed.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                {progress.isExceeded && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Budget dépassé !
                  </Alert>
                )}
              </Paper>
            </Grid>
          );
        })}

        {budgets.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucun budget créé pour le moment
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBudget ? 'Modifier le Budget' : 'Nouveau Budget'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom du budget"
            value={currentBudget.name}
            onChange={(e) => setCurrentBudget({ ...currentBudget, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Montant"
            type="number"
            value={currentBudget.amount}
            onChange={(e) => setCurrentBudget({ ...currentBudget, amount: parseFloat(e.target.value) })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Date de début"
            type="date"
            value={currentBudget.startDate}
            onChange={(e) => setCurrentBudget({ ...currentBudget, startDate: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Date de fin"
            type="date"
            value={currentBudget.endDate}
            onChange={(e) => setCurrentBudget({ ...currentBudget, endDate: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Catégorie"
            value={currentBudget.categoryId}
            onChange={(e) => setCurrentBudget({ ...currentBudget, categoryId: e.target.value })}
            margin="normal"
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            Modifier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
