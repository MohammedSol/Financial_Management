import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Verrouiller/Déverrouiller un utilisateur
  const handleToggleLock = async (userId, currentStatus) => {
    try {
      const action = currentStatus ? 'déverrouiller' : 'verrouiller';
      if (!window.confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
        return;
      }

      await api.put(`/api/admin/users/${userId}/lock`);
      
      // Mettre à jour la liste localement
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isLocked: !user.isLocked }
          : user
      ));

      alert(`Utilisateur ${action}é avec succès`);
    } catch (err) {
      console.error('Erreur lors du verrouillage:', err);
      alert('Erreur lors de l\'opération');
    }
  };

  // Ouvrir le dialogue de suppression
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/api/admin/users/${userToDelete.id}`);
      
      // Retirer l'utilisateur de la liste
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      alert('Utilisateur supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Configuration des colonnes
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'name',
      headerName: 'Nom',
      width: 200,
      flex: 1
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      flex: 1
    },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'Admin' ? <AdminIcon /> : null}
          label={params.value}
          color={params.value === 'Admin' ? 'error' : 'primary'}
          size="small"
        />
      )
    },
    {
      field: 'isLocked',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Bloqué' : 'Actif'}
          color={params.value ? 'error' : 'success'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Date d\'inscription',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'transactionsCount',
      headerName: 'Transactions',
      width: 120,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'accountsCount',
      headerName: 'Comptes',
      width: 100,
      align: 'center',
      headerAlign: 'center'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {params.row.role !== 'Admin' && (
            <>
              <Tooltip title={params.row.isLocked ? 'Débloquer' : 'Bloquer'}>
                <IconButton
                  size="small"
                  color={params.row.isLocked ? 'success' : 'warning'}
                  onClick={() => handleToggleLock(params.row.id, params.row.isLocked)}
                >
                  {params.row.isLocked ? <LockOpenIcon /> : <LockIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Supprimer">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(params.row)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Gestion des Utilisateurs
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
      </Paper>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cette action est irréversible !
          </Alert>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.name}</strong> ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Toutes les données associées seront également supprimées :
          </Typography>
          <Box component="ul" sx={{ mt: 1 }}>
            <li>Comptes bancaires</li>
            <li>Transactions</li>
            <li>Budgets</li>
            <li>Catégories</li>
            <li>Notifications</li>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
