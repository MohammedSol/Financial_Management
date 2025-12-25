import { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';
import api from '../services/api';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState(null);

  // Icônes selon la sévérité
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <SuccessIcon color="success" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Couleur selon la sévérité
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'success':
        return 'success.main';
      default:
        return 'info.main';
    }
  };

  // Charger les notifications initiales
  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      
      const countResponse = await api.get('/notifications/count');
      setUnreadCount(countResponse.data.unreadCount);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Connexion SignalR
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5161/notificationHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.on('ReceiveNotification', (notification) => {
      console.log('🔔 Notification reçue:', notification);
      
      // Ajouter la notification à la liste
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Notification navigateur
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    newConnection.start()
      .then(() => {
        console.log('✅ Connecté au NotificationHub SignalR');
        setConnection(newConnection);
      })
      .catch(err => console.error('❌ Erreur connexion SignalR:', err));

    // Charger les notifications existantes
    loadNotifications();

    // Demander permission notifications navigateur
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  // Ouvrir le menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Fermer le menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      handleClose();
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
    }
  };

  // Supprimer une notification
  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 2 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600
          }
        }}
      >
        {/* En-tête */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications ({unreadCount})
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Tout marquer comme lu
            </Button>
          )}
        </Box>

        <Divider />

        {/* Liste des notifications */}
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Aucune notification
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              sx={{
                backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                borderLeft: 4,
                borderColor: getSeverityColor(notification.severity),
                '&:hover': {
                  backgroundColor: notification.isRead ? 'action.hover' : 'action.selected'
                }
              }}
            >
              <ListItemIcon>
                {getSeverityIcon(notification.severity)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }} component="span">
                      {notification.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(notification.id, e)}
                      sx={{ ml: 1 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'block' }} component="span">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }} component="span">
                      {new Date(notification.createdAt).toLocaleString('fr-FR')}
                    </Typography>
                    {!notification.isRead && (
                      <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
                        <Chip label="Nouveau" size="small" color="primary" />
                      </Box>
                    )}
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <Divider />
            <MenuItem onClick={handleClose}>
              <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
                Voir toutes les notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}
