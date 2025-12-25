import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Box,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import api from '../services/api';

export default function RecurringPayments() {
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dayOfMonth: 1,
    categoryId: '',
    accountId: '',
    isActive: true
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, categoriesRes, accountsRes] = await Promise.all([
        api.get('/recurringpayments'),
        api.get('/categories'),
        api.get('/accounts')
      ]);
      
      setPayments(paymentsRes.data);
      setCategories(categoriesRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.response?.data?.message || error.message}` });
    }
  };

  const handleOpen = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name,
        amount: payment.amount,
        dayOfMonth: payment.dayOfMonth,
        categoryId: payment.categoryId || '',
        accountId: payment.accountId || '',
        isActive: payment.isActive
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        amount: '',
        dayOfMonth: 1,
        categoryId: '',
        accountId: '',
        isActive: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPayment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        accountId: formData.accountId || null
      };

      if (editingPayment) {
        await api.put(`/recurringpayments/${editingPayment.id}`, { ...payload, id: editingPayment.id });
        setMessage({ type: 'success', text: '✅ Paiement récurrent modifié' });
      } else {
        await api.post('/recurringpayments', payload);
        setMessage({ type: 'success', text: '✅ Paiement récurrent créé' });
      }

      handleClose();
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.response?.data?.message || error.message}` });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce paiement récurrent ?')) return;

    try {
      await api.delete(`/recurringpayments/${id}`);
      setMessage({ type: 'success', text: '✅ Paiement récurrent supprimé' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.response?.data?.message || error.message}` });
    }
  };

  const handleToggle = async (payment) => {
    try {
      await api.put(`/recurringpayments/${payment.id}/toggle`);
      setMessage({ type: 'success', text: `✅ Paiement ${payment.isActive ? 'désactivé' : 'activé'}` });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error.response?.data?.message || error.message}` });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon /> Paiements Récurrents
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Nouveau Paiement
          </Button>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Jour du Mois</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Compte</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun paiement récurrent configuré
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.name}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {payment.amount.toFixed(2)} MAD
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Jour ${payment.dayOfMonth}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {payment.category?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.account?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={payment.isActive}
                            onChange={() => handleToggle(payment)}
                            color="success"
                          />
                        }
                        label={payment.isActive ? 'Actif' : 'Inactif'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpen(payment)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog Formulaire */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingPayment ? 'Modifier' : 'Nouveau'} Paiement Récurrent
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Nom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Montant (MAD)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              inputProps={{ step: '0.01', min: '0' }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Jour du Mois (1-31)"
              value={formData.dayOfMonth}
              onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
              required
              inputProps={{ min: 1, max: 31 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Catégorie (optionnel)"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Aucune</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Compte (optionnel)"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Aucun</MenuItem>
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="success"
                />
              }
              label="Actif"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="contained">
              {editingPayment ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
