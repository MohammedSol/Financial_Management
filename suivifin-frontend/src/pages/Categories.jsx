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
import FolderIcon from '@mui/icons-material/Folder';
import api from '../services/api';

// Liste d'icônes Material-UI disponibles
const iconOptions = [
  { value: 'ShoppingCart', label: 'Panier', icon: '🛒' },
  { value: 'Restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'Home', label: 'Maison', icon: '🏠' },
  { value: 'DirectionsCar', label: 'Voiture', icon: '🚗' },
  { value: 'LocalHospital', label: 'Santé', icon: '🏥' },
  { value: 'School', label: 'Éducation', icon: '🎓' },
  { value: 'SportsEsports', label: 'Loisirs', icon: '🎮' },
  { value: 'Work', label: 'Travail', icon: '💼' },
  { value: 'AccountBalance', label: 'Banque', icon: '🏦' },
  { value: 'LocalGasStation', label: 'Essence', icon: '⛽' },
  { value: 'Phone', label: 'Téléphone', icon: '📱' },
  { value: 'ElectricBolt', label: 'Électricité', icon: '⚡' },
  { value: 'Wifi', label: 'Internet', icon: '📡' },
  { value: 'Pets', label: 'Animaux', icon: '🐾' },
  { value: 'CardGiftcard', label: 'Cadeaux', icon: '🎁' },
  { value: 'FitnessCenter', label: 'Sport', icon: '💪' },
  { value: 'Movie', label: 'Cinéma', icon: '🎬' },
  { value: 'FlightTakeoff', label: 'Voyage', icon: '✈️' },
  { value: 'Savings', label: 'Épargne', icon: '💰' },
  { value: 'Paid', label: 'Salaire', icon: '💵' }
];

// Palette de couleurs prédéfinies
const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  '#E63946', '#457B9D', '#F72585', '#7209B7', '#3A0CA3'
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    name: '',
    description: '',
    type: 'Expense',
    icon: 'ShoppingCart',
    color: '#FF6B6B'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setEditMode(true);
    } else {
      setCurrentCategory({
        name: '',
        description: '',
        type: 'Expense',
        icon: 'ShoppingCart',
        color: '#FF6B6B'
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
        await api.put(`/categories/${currentCategory.id}`, currentCategory);
      } else {
        await api.post('/categories', currentCategory);
      }
      loadCategories();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await api.delete(`/categories/${id}`);
        loadCategories();
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'Income');
  const expenseCategories = categories.filter(c => c.type === 'Expense');

  return (
    <Box sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderIcon fontSize="large" />
          Catégories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouvelle Catégorie
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Catégories Revenus */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="success.main">
              💰 Revenus ({incomeCategories.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Icône</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: category.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                          }}
                        >
                          {iconOptions.find(i => i.value === category.icon)?.icon || '📁'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold">
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenDialog(category)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(category.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {incomeCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">Aucune catégorie de revenu</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Catégories Dépenses */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="error.main">
              💸 Dépenses ({expenseCategories.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Icône</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: category.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px'
                          }}
                        >
                          {iconOptions.find(i => i.value === category.icon)?.icon || '📁'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold">
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenDialog(category)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(category.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenseCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">Aucune catégorie de dépense</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Création/Modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nom"
            value={currentCategory.name}
            onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={currentCategory.description}
            onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            select
            label="Type"
            value={currentCategory.type}
            onChange={(e) => setCurrentCategory({ ...currentCategory, type: e.target.value })}
            margin="normal"
            required
          >
            <MenuItem value="Income">Revenu</MenuItem>
            <MenuItem value="Expense">Dépense</MenuItem>
          </TextField>

          {/* Sélecteur d'icône */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Icône
          </Typography>
          <Grid container spacing={1}>
            {iconOptions.map((option) => (
              <Grid item key={option.value}>
                <Box
                  onClick={() => setCurrentCategory({ ...currentCategory, icon: option.value })}
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '8px',
                    border: currentCategory.icon === option.value ? '3px solid #1976d2' : '2px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '24px',
                    bgcolor: currentCategory.icon === option.value ? '#e3f2fd' : 'white',
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  }}
                  title={option.label}
                >
                  {option.icon}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Sélecteur de couleur */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Couleur
          </Typography>
          <Grid container spacing={1}>
            {colorOptions.map((color) => (
              <Grid item key={color}>
                <Box
                  onClick={() => setCurrentCategory({ ...currentCategory, color })}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: currentCategory.color === color ? '3px solid #000' : '2px solid #ddd',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>

          {/* Aperçu */}
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Aperçu
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: currentCategory.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px'
                }}
              >
                {iconOptions.find(i => i.value === currentCategory.icon)?.icon || '📁'}
              </Box>
              <Box>
                <Typography variant="h6">{currentCategory.name || 'Nom de la catégorie'}</Typography>
                <Chip 
                  label={currentCategory.type === 'Income' ? 'Revenu' : 'Dépense'}
                  size="small"
                  color={currentCategory.type === 'Income' ? 'success' : 'error'}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={!currentCategory.name}>
            {editMode ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
