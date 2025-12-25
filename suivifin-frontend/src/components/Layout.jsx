import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  IconButton,
  Avatar
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PieChartIcon from '@mui/icons-material/PieChart';
import CategoryIcon from '@mui/icons-material/Category';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import NotificationBell from './NotificationBell';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Comptes', icon: <AccountBalanceWalletIcon />, path: '/accounts' },
  { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
  { text: 'Budgets', icon: <PieChartIcon />, path: '/budgets' },
  { text: 'Catégories', icon: <CategoryIcon />, path: '/categories' },
];

const toolsItems = [
  { text: 'ML Prédiction', icon: <PsychologyIcon />, path: '/ml' },
  { text: 'Prévisions', icon: <TrendingUpIcon />, path: '/forecast' },
  { text: 'Export/Import', icon: <CloudDownloadIcon />, path: '/export-import' },
  { text: 'Paiements', icon: <CalendarMonthIcon />, path: '/recurring-payments' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openAddMenu, setOpenAddMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddClick = () => {
    // Pour l'instant, redirige vers la page Transactions
    navigate('/transactions');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#fff',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        {/* Logo/Titre */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <AccountBalanceWalletIcon />
          </Avatar>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            Suivi Financier
          </Typography>
        </Box>

        {/* Bouton Ajouter */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              }
            }}
          >
            Ajouter
          </Button>
        </Box>

        <Divider />

        {/* Menu Principal */}
        <List sx={{ px: 1, pt: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? '#fff' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? '#fff' : 'text.secondary',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Outils */}
        <Box sx={{ px: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 1, fontWeight: 600 }}>
            Outils
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {toolsItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? '#fff' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? '#fff' : 'text.secondary',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* User Info & Notifications */}
        <Box sx={{ px: 2, py: 2, borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.9rem' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 120 }}>
                {user?.email?.split('@')[0]}
              </Typography>
            </Box>
            <NotificationBell />
          </Box>
          
          {/* Bouton Déconnexion */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              color: 'error.main',
              borderColor: 'error.main',
              '&:hover': {
                bgcolor: 'error.light',
                borderColor: 'error.dark',
              }
            }}
          >
            Déconnexion
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#F4F6F8',
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
