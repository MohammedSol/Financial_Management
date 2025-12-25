import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Attendre que le contexte soit mis à jour
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Récupérer le rôle depuis localStorage
        const userRole = localStorage.getItem('userRole');
        console.log('🔐 Redirection avec rôle:', userRole);
        
        // Rediriger selon le rôle
        if (userRole === 'Admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la connexion:', err);
      setError('Une erreur est survenue lors de la connexion');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Suivi Financier
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connectez-vous pour gérer vos finances
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>

            <Typography variant="body2" align="center">
              Pas encore de compte ?{' '}
              <Link component={RouterLink} to="/register" sx={{ color: 'primary.main' }}>
                S'inscrire
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
