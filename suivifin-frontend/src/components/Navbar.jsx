import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FolderIcon from '@mui/icons-material/Folder';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <AccountBalanceIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Suivi Financier
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" onClick={() => navigate('/')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate('/accounts')}>
            Comptes
          </Button>
          <Button color="inherit" onClick={() => navigate('/transactions')}>
            Transactions
          </Button>
          <Button color="inherit" onClick={() => navigate('/budgets')}>
            Budgets
          </Button>
          <Button color="inherit" onClick={() => navigate('/categories')} startIcon={<FolderIcon />}>
            Catégories
          </Button>
          <Button color="inherit" onClick={() => navigate('/ml')} startIcon={<PsychologyIcon />}>
            ML
          </Button>
          <Button color="inherit" onClick={() => navigate('/export-import')} startIcon={<CloudDownloadIcon />}>
            Export/Import
          </Button>
          <Button color="inherit" onClick={() => navigate('/recurring-payments')} startIcon={<CalendarMonthIcon />}>
            Paiements
          </Button>
          
          {/* Cloche de notifications */}
          <NotificationBell />
          
          <Button 
            color="inherit" 
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Déconnexion
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
