import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import {
  PlayArrow as TrainIcon,
  Psychology as PredictIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ML() {
  const [loading, setLoading] = useState(false);
  const [trainResult, setTrainResult] = useState('');
  const [testText, setTestText] = useState('');
  const [prediction, setPrediction] = useState('');
  const [error, setError] = useState('');
  const [predictionHistory, setPredictionHistory] = useState([]);

  const handleTrain = async () => {
    setLoading(true);
    setError('');
    setTrainResult('');
    try {
      const response = await api.get('/ml/train');
      setTrainResult(response.data);
    } catch (err) {
      setError(err.response?.data || 'Erreur lors de l\'entraînement du modèle');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!testText.trim()) {
      setError('Veuillez entrer un texte à tester');
      return;
    }

    setLoading(true);
    setError('');
    setPrediction('');
    try {
      const response = await api.get(`/ml/test?text=${encodeURIComponent(testText)}`);
      setPrediction(response.data);
      
      // Ajouter à l'historique pour le graphique
      const categoryMatch = response.data.match(/Catégorie prédite: (.+)/);
      if (categoryMatch) {
        const category = categoryMatch[1].trim();
        setPredictionHistory(prev => {
          const updated = [...prev];
          const existing = updated.find(item => item.category === category);
          if (existing) {
            existing.count++;
          } else {
            updated.push({ category, count: 1 });
          }
          return updated.slice(-10); // Garder les 10 dernières
        });
      }
    } catch (err) {
      setError(err.response?.data || 'Erreur lors de la prédiction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PredictIcon fontSize="large" />
        Machine Learning - Prédiction de Catégories
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Section Entraînement */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          🎓 Entraînement du Modèle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Entraînez le modèle ML avec les données d'entraînement pour améliorer la précision des prédictions.
          Le modèle apprendra à partir du fichier <code>MLData/training-data.csv</code>.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <TrainIcon />}
          onClick={handleTrain}
          disabled={loading}
          size="large"
        >
          {loading ? 'Entraînement en cours...' : 'Entraîner le Modèle'}
        </Button>

        {trainResult && (
          <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SuccessIcon color="success" />
                <Typography variant="h6" color="success.dark">
                  Résultat
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {trainResult}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Section Test/Prédiction */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🔮 Test de Prédiction
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Testez le modèle entraîné en entrant une description de transaction. Le modèle prédira automatiquement
          la catégorie la plus appropriée.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Description de la transaction"
            placeholder="Ex: Courses Carrefour, Facture électricité, Salaire..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            fullWidth
            sx={{ flex: 1, minWidth: 300 }}
          />
          <Button
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PredictIcon />}
            onClick={handlePredict}
            disabled={loading || !testText.trim()}
            size="large"
          >
            Prédire
          </Button>
        </Box>

        {/* Exemples rapides */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Exemples rapides:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              'Courses Carrefour',
              'Facture électricité',
              'Salaire mensuel',
              'Restaurant McDonald\'s',
              'Station service Total',
              'Loyer appartement'
            ].map((example) => (
              <Button
                key={example}
                size="small"
                variant="outlined"
                onClick={() => setTestText(example)}
              >
                {example}
              </Button>
            ))}
          </Box>
        </Box>

        {prediction && (
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="h6" color="info.dark" gutterBottom>
                📊 Résultat de la Prédiction
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {prediction}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>

      {/* Graphique des prédictions */}
      {predictionHistory.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Historique des Catégories Prédites
          </Typography>
          <Box sx={{ height: 300 }}>
            <Bar
              data={{
                labels: predictionHistory.map(item => item.category),
                datasets: [{
                  label: 'Nombre de prédictions',
                  data: predictionHistory.map(item => item.count),
                  backgroundColor: '#9c27b0',
                  borderRadius: 5
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
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </Box>
        </Paper>
      )}

      {/* Instructions */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          📚 Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>
              <strong>Préparation des données:</strong> Assurez-vous que le fichier{' '}
              <code>MLData/training-data.csv</code> existe avec les colonnes TitreTransaction et Categorie.
            </li>
            <li>
              <strong>Entraînement:</strong> Cliquez sur "Entraîner le Modèle" pour créer le modèle ML.
              Cela peut prendre quelques secondes.
            </li>
            <li>
              <strong>Test:</strong> Une fois le modèle entraîné, entrez une description de transaction
              pour voir la catégorie prédite automatiquement.
            </li>
            <li>
              <strong>Utilisation:</strong> Le modèle peut ensuite être utilisé automatiquement lors de
              la création de nouvelles transactions pour suggérer des catégories.
            </li>
          </ol>
        </Typography>
      </Paper>
    </Box>
  );
}
