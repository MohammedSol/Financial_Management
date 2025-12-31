import { Card, CardContent, Typography, Box, IconButton, LinearProgress, Menu, MenuItem } from '@mui/material';
import { MoreVert, AccountBalance, Savings, CreditCard } from '@mui/icons-material';
import { useState } from 'react';

const getGradient = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('epargne') || t.includes('saving')) 
    return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'; 
  if (t.includes('courant') || t.includes('current')) 
    return 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'; 
  return 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)'; 
};

const getIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('epargne')) return <Savings sx={{ color: 'white', opacity: 0.8 }} fontSize="large"/>;
  return <AccountBalance sx={{ color: 'white', opacity: 0.8 }} fontSize="large"/>;
};

export default function AccountCard({ account, onEdit, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const maskedNumber = account.accountNumber 
    ? `•••• ${account.accountNumber.slice(-4)}` 
    : '•••• ••••';

  const progress = account.targetAmount > 0 
    ? Math.min((account.balance / account.targetAmount) * 100, 100) 
    : 0;

  return (
    <Card sx={{ 
      borderRadius: 4, 
      background: getGradient(account.type),
      color: 'white',
      minHeight: 200,
      position: 'relative',
      boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-5px)' }
    }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box display="flex" gap={2} alignItems="center">
            {getIcon(account.type)}
            <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.7, textTransform: 'uppercase' }}>
                    {account.type}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                    {account.name}
                </Typography>
            </Box>
          </Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'white' }}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box mt={3} mb={3}>
            <Typography variant="h4" fontWeight="bold">
                {account.balance.toLocaleString()} <span style={{fontSize: '0.5em'}}>{account.currency}</span>
            </Typography>
        </Box>

        <Box>
             <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'monospace' }}>
                {maskedNumber}
            </Typography>

            {account.targetAmount > 0 && (
                <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" fontSize={11} mb={0.5} sx={{ opacity: 0.9 }}>
                        <span>Objectif: {account.targetAmount}</span>
                        <span>{Math.round(progress)}%</span>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ 
                            height: 6, borderRadius: 3, 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            '& .MuiLinearProgress-bar': { bgcolor: 'white' } 
                        }} 
                    />
                </Box>
            )}
        </Box>
      </CardContent>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { onEdit(account); setAnchorEl(null); }}>Modifier</MenuItem>
        <MenuItem onClick={() => { onDelete(account.id); setAnchorEl(null); }} sx={{ color: 'error.main' }}>Fermer le compte</MenuItem>
      </Menu>
    </Card>
  );
}