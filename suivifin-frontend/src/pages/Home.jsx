import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  AppBar,
  Toolbar,
  Stack
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import InsightsIcon from '@mui/icons-material/Insights';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Navbar Publique */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: '#fff', 
          borderBottom: '1px solid #e0e0e0',
          py: 1
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 700,
                  letterSpacing: '-0.5px'
                }}
              >
                Suivi Financier
              </Typography>
            </Box>

            {/* Boutons */}
            <Stack direction="row" spacing={2}>
              <Button 
                component={RouterLink}
                to="/login"
                color="primary"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3
                }}
              >
                Se connecter
              </Button>
              <Button 
                component={RouterLink}
                to="/register"
                variant="contained"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 3,
                  px: 3,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                S'inscrire
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <Grid 
          container 
          spacing={6} 
          sx={{ 
            minHeight: { xs: 'auto', md: 'calc(100vh - 100px)' },
            alignItems: 'center',
            py: { xs: 8, md: 4 }
          }}
        >
          {/* Gauche - Texte */}
          <Grid item xs={12} md={6}>
            <Box sx={{ pr: { md: 4 } }}>
              <Typography 
                variant="h2" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2,
                  mb: 3,
                  color: '#1a1a1a'
                }}
              >
                Empower your finances, simplify your life.
              </Typography>
              
              <Typography 
                variant="h5" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  lineHeight: 1.6,
                  mb: 4,
                  fontWeight: 400
                }}
              >
                Gérez vos budgets, suivez vos dépenses et atteignez vos objectifs 
                financiers avec notre solution professionnelle.
              </Typography>

              <Button 
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  px: 5,
                  py: 1.8,
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                Commencer maintenant
              </Button>

              {/* Stats rapides */}
              <Grid container spacing={3} sx={{ mt: 5 }}>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    1000+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilisateurs actifs
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    50M+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    MAD gérés
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    99.9%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disponibilité
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Droite - Image */}
          <Grid item xs={12} md={6}>
            <Box 
              sx={{ 
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Box
                component="img"
                src="https://static.vecteezy.com/system/resources/previews/001/100/116/non_2x/man-success-to-manage-his-finance-growth-isometric-financial-management-illustration-vector.jpg"
                alt="Financial Dashboard Preview"
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: 6,
                  '&:hover': {
                    boxShadow: 10,
                    transform: 'scale(1.02)',
                    transition: 'all 0.3s ease'
                  }
                }}
              />
              {/* Décorations */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  opacity: 0.2,
                  zIndex: -1
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  bgcolor: 'secondary.light',
                  opacity: 0.15,
                  zIndex: -1
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 10, mt: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Pourquoi nous choisir ?
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Une solution complète pour votre gestion financière
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Feature 1 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  p: 4,
                  bgcolor: '#fff',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Suivi en temps réel
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualisez vos dépenses et revenus instantanément avec des graphiques intuitifs
                </Typography>
              </Box>
            </Grid>

            {/* Feature 2 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  p: 4,
                  bgcolor: '#fff',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <InsightsIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  IA & ML
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prévisions intelligentes basées sur vos habitudes avec ML.NET
                </Typography>
              </Box>
            </Grid>

            {/* Feature 3 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  p: 4,
                  bgcolor: '#fff',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <SecurityIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  100% Sécurisé
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vos données sont cryptées et protégées avec les dernières normes
                </Typography>
              </Box>
            </Grid>

            {/* Feature 4 */}
            <Grid item xs={12} sm={6} md={3}>
              <Box 
                sx={{ 
                  textAlign: 'center',
                  p: 4,
                  bgcolor: '#fff',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-8px)'
                  }
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Simple & Efficace
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interface intuitive pensée pour vous faire gagner du temps
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="md">
          <Box 
            sx={{ 
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: '#fff',
              p: 6,
              borderRadius: 4,
              boxShadow: 6
            }}
          >
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Prêt à commencer ?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Rejoignez des milliers d'utilisateurs qui ont pris le contrôle de leurs finances
            </Typography>
            <Button 
              component={RouterLink}
              to="/register"
              variant="contained"
              size="large"
              sx={{ 
                bgcolor: '#fff',
                color: 'primary.main',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                borderRadius: 3,
                px: 5,
                py: 1.8,
                boxShadow: 3,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  boxShadow: 6
                }
              }}
            >
              Créer un compte gratuit
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        sx={{ 
          bgcolor: '#1a1a1a', 
          color: '#fff',
          py: 4,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © 2025 Suivi Financier. Tous droits réservés.
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.5, mt: 1, display: 'block' }}>
            © 2025 – Système de management financier - Développée par notre équipe
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
