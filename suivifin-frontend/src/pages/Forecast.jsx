import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../services/api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CalculateIcon from '@mui/icons-material/Calculate';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Forecast() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forecast/balance');
      console.log('📊 Données de prévision:', response.data);
      setForecastData(response.data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement prévision:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement de la prévision');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!forecastData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">Aucune donnée de prévision disponible</Alert>
      </Box>
    );
  }

  // Préparer les données pour le graphique
  const allData = [...forecastData.historicalData, ...forecastData.forecastData];
  const labels = allData.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  });

  const historicalValues = forecastData.historicalData.map(d => d.balance);
  const forecastValues = new Array(forecastData.historicalData.length).fill(null).concat(
    forecastData.forecastData.map(d => d.balance)
  );

  // Pour la ligne de connexion entre historique et prévision
  const connectionValues = new Array(forecastData.historicalData.length - 1).fill(null);
  connectionValues.push(forecastData.historicalData[forecastData.historicalData.length - 1]?.balance || 0);
  connectionValues.push(forecastData.forecastData[0]?.balance || 0);
  connectionValues.push(...new Array(forecastData.forecastData.length - 1).fill(null));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Historique Réel',
        data: historicalValues,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1976d2',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Connexion',
        data: connectionValues,
        borderColor: '#90caf9',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
        fill: false,
        showLine: true
      },
      {
        label: forecastData.usedMachineLearning ? 'Prévision ML (SSA)' : 'Prévision Mathématique',
        data: forecastValues,
        borderColor: forecastData.usedMachineLearning ? '#9c27b0' : '#ff9800',
        backgroundColor: forecastData.usedMachineLearning ? 'rgba(156, 39, 176, 0.05)' : 'rgba(255, 152, 0, 0.05)',
        borderWidth: 2,
        borderDash: [10, 5],
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: forecastData.usedMachineLearning ? '#9c27b0' : '#ff9800',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: {
            size: 13,
            weight: 500
          },
          usePointStyle: true,
          filter: (item) => item.text !== 'Connexion'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const dataPoint = allData[index];
            if (!dataPoint) return '';
            
            const date = new Date(dataPoint.date);
            return date.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            });
          },
          label: (context) => {
            if (context.dataset.label === 'Connexion') return null;
            
            const index = context.dataIndex;
            const dataPoint = allData[index];
            if (!dataPoint) return null;
            
            const type = dataPoint.type === 'historical' ? 'Historique' : 
                        dataPoint.type === 'forecast_ml' ? 'Prévision ML' : 
                        'Prévision Math';
            
            return `${type}: ${context.parsed.y.toFixed(2)} MAD`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value.toFixed(0)} MAD`,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  const currentBalance = forecastData.historicalData[forecastData.historicalData.length - 1]?.balance || 0;
  const lastForecast = forecastData.forecastData[forecastData.forecastData.length - 1]?.balance || 0;
  const projectedChange = lastForecast - currentBalance;
  const projectedChangePercent = currentBalance !== 0 ? (projectedChange / currentBalance) * 100 : 0;

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          📈 Prévision Financière
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Projection de votre solde basée sur vos habitudes de dépenses
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Solde Actuel
            </Typography>
            <Typography variant="h5" fontWeight={700} color="primary">
              {currentBalance.toFixed(2)} MAD
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Solde Prévu (Fin de mois)
            </Typography>
            <Typography variant="h5" fontWeight={700} color={lastForecast >= currentBalance ? 'success.main' : 'error.main'}>
              {lastForecast.toFixed(2)} MAD
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Changement Projeté
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {projectedChange >= 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
              <Typography variant="h5" fontWeight={700} color={projectedChange >= 0 ? 'success.main' : 'error.main'}>
                {projectedChange >= 0 ? '+' : ''}{projectedChange.toFixed(2)} MAD
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              ({projectedChange >= 0 ? '+' : ''}{projectedChangePercent.toFixed(1)}%)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Méthode de Prévision
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
              {forecastData.usedMachineLearning ? (
                <>
                  <PsychologyIcon color="primary" />
                  <Chip 
                    label="ML.NET SSA" 
                    color="primary" 
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </>
              ) : (
                <>
                  <CalculateIcon color="warning" />
                  <Chip 
                    label="Mathématique" 
                    color="warning" 
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {forecastData.historicalDays} jours d'historique
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Info Alert */}
      {!forecastData.usedMachineLearning && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Prévision mathématique active</strong> - Il faut au moins {forecastData.minimumHistoryDays} jours 
          d'historique pour utiliser l'algorithme ML.NET SSA. Continuez à enregistrer vos transactions !
        </Alert>
      )}

      {/* Chart */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 3,
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Évolution et Prévision du Solde
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Du {new Date(forecastData.startDate).toLocaleDateString('fr-FR')} au{' '}
              {new Date(forecastData.endDate).toLocaleDateString('fr-FR')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 3, bgcolor: '#1976d2', borderRadius: 1 }} />
              <Typography variant="caption">Historique</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 16, 
                height: 3, 
                bgcolor: forecastData.usedMachineLearning ? '#9c27b0' : '#ff9800',
                borderRadius: 1,
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 5px, #fff 5px, #fff 8px)'
              }} />
              <Typography variant="caption">Prévision</Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ height: 450 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Paper>

      {/* Footer Info */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mt: 3,
          borderRadius: 3,
          border: '1px solid #e0e0e0',
          bgcolor: '#f5f5f5'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <strong>💡 Comment ça marche ?</strong><br />
          {forecastData.usedMachineLearning ? (
            <>
              L'algorithme <strong>SSA (Singular Spectrum Analysis)</strong> de ML.NET analyse vos {forecastData.historicalDays} jours 
              d'historique pour détecter les tendances et motifs dans vos finances. Il utilise une fenêtre glissante de 7 jours 
              et un intervalle de confiance de 95% pour prédire votre solde jusqu'à la fin du mois.
            </>
          ) : (
            <>
              En attendant d'avoir suffisamment de données ({forecastData.minimumHistoryDays}+ jours), nous utilisons une 
              <strong> projection mathématique simple</strong> basée sur votre flux financier moyen quotidien 
              pour estimer votre solde futur.
            </>
          )}
        </Typography>
      </Paper>
    </Box>
  );
}
