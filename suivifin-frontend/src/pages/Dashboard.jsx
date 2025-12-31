
import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Chip, Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setDashboard(response.data);
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !dashboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const calculateSavings = () => {
    return dashboard.totalIncome - dashboard.totalExpense;
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bienvenue, {user?.email} ! Voici un aperçu de vos finances.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Solde Total */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                <AccountBalanceWalletIcon />
              </Avatar>
              <Typography variant="overline" color="text.secondary" fontWeight={600}>
                Solde Total
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {dashboard.totalBalance?.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAD
            </Typography>
          </Paper>
        </Grid>

        {/* Revenus du mois */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Typography variant="overline" color="text.secondary" fontWeight={600}>
                Revenus du mois
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {dashboard.totalIncome?.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAD
            </Typography>
          </Paper>
        </Grid>

        {/* Dépenses du mois */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light', mr: 2 }}>
                <TrendingDownIcon />
              </Avatar>
              <Typography variant="overline" color="text.secondary" fontWeight={600}>
                Dépenses du mois
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {dashboard.totalExpense?.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAD
            </Typography>
          </Paper>
        </Grid>

        {/* Épargne */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light', mr: 2 }}>
                <SavingsIcon />
              </Avatar>
              <Typography variant="overline" color="text.secondary" fontWeight={600}>
                Épargne
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              fontWeight={700}
              color={calculateSavings() >= 0 ? 'success.main' : 'error.main'}
            >
              {calculateSavings().toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MAD
            </Typography>
          </Paper>
        </Grid>
      </Grid>


      {/* Graphiques */}
      <Grid container spacing={3}>
        {/* Revenus vs Dépenses */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenus vs Dépenses
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Aperçu de vos finances du mois en cours
            </Typography>
            <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {dashboard.totalIncome > 0 || dashboard.totalExpense > 0 ? (
                <Doughnut
                  data={{
                    labels: ['Revenus', 'Dépenses'],
                    datasets: [{
                      data: [dashboard.totalIncome, dashboard.totalExpense],
                      backgroundColor: ['#4caf50', '#f44336'],
                      borderWidth: 0,
                      hoverOffset: 10
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          font: {
                            size: 14,
                            weight: 500
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(2) + ' MAD';
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Aucune donnée disponible
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Créez des transactions pour voir le graphique
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Dépenses par catégorie */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              height: '100%'
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Dépenses par Catégorie
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Répartition de vos dépenses
            </Typography>
            <Box sx={{ height: 350 }}>
              {dashboard.categoryTotals && Object.keys(dashboard.categoryTotals).length > 0 ? (
                <Bar
                  data={{
                    labels: Object.keys(dashboard.categoryTotals),
                    datasets: [{
                      label: 'Montant (MAD)',
                      data: Object.values(dashboard.categoryTotals),
                      backgroundColor: '#1976d2',
                      borderRadius: 8,
                      barThickness: 30
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: '#f0f0f0'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary" textAlign="center">
                    Aucune donnée disponible
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Transactions récentes */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mt: 3, 
          borderRadius: 3,
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Transactions récentes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dernières opérations effectuées
            </Typography>
          </Box>
          <Chip label={`${dashboard.recentTransactions?.length || 0} transactions`} color="primary" variant="outlined" />
        </Box>
        {dashboard.recentTransactions && dashboard.recentTransactions.length > 0 ? (
          <Box>
            {dashboard.recentTransactions.map((transaction, index) => (
              <Box
                key={transaction.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 2.5,
                  px: 2,
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: index % 2 === 0 ? '#fafafa' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#f0f0f0',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: transaction.amount >= 0 ? 'success.light' : 'error.light',
                      width: 45,
                      height: 45
                    }}
                  >
                    {transaction.amount >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {transaction.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(transaction.date).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })} • {transaction.category || 'Non catégorisé'}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ 
                    color: transaction.amount >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {transaction.amount >= 0 ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} MAD
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              Aucune transaction pour le moment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Commencez à ajouter vos transactions pour voir un aperçu ici
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
