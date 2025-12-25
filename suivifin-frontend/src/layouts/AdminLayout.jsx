import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Paid as PaidIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Transactions', icon: <PaidIcon />, path: '/admin/transactions' },
  { text: 'Paramètres', icon: <SettingsIcon />, path: '/admin/settings' },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Fixe */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#111827',
            color: 'white',
            borderRight: 'none',
          },
        }}
      >
        {/* Header Admin */}
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: '#3b82f6',
              margin: '0 auto',
              mb: 1,
            }}
          >
            <AdminIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Admin Panel
          </Typography>
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            {user?.email || 'Administrateur'}
          </Typography>
        </Box>

        <Divider sx={{ bgcolor: '#374151' }} />

        {/* Menu de navigation */}
        <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  color: 'white',
                  bgcolor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#3b82f6' : '#9ca3af', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ bgcolor: '#374151' }} />

        {/* Bouton Déconnexion */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              color: 'white',
              borderColor: '#374151',
              '&:hover': {
                borderColor: '#ef4444',
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
              },
            }}
          >
            Déconnexion
          </Button>
        </Box>
      </Drawer>

      {/* Contenu Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f9fafb',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
