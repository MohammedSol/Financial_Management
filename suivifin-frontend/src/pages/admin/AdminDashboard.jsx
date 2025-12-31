import { useEffect, useState } from 'react';
import { 
  Grid, Paper, Typography, Box, Card, CardContent, Chip 
} from '@mui/material';
import { 
  People, Receipt, AccountBalanceWallet, Dns, Speed, CheckCircle 
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../../services/api';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Erreur stats", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Chargement du Cockpit...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        🚀 Cockpit Administrateur
      </Typography>

      {/* 1. ZONE KPIs (CHIFFRES CLÉS) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <StatCard title="Utilisateurs Totaux" value={stats.totalUsers} icon={<People />} color="#1976d2" />
        <StatCard title="Transactions Totales" value={stats.totalTransactions} icon={<Receipt />} color="#2e7d32" />
        <StatCard title="Volume Financier" value={`${stats.totalVolume?.toLocaleString()} MAD`} icon={<AccountBalanceWallet />} color="#ed6c02" />
        
        {/* Carte Système (Le petit plus technique) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: '#1e293b', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Dns fontSize="small" /> <Typography variant="subtitle2">Infrastructure</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Redis Cache</Typography>
                <Chip label="Connecté" size="small" color="success" icon={<CheckCircle />} />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Latence DB</Typography>
                <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 'bold' }}>
                  {stats.databaseLatency} <Speed fontSize="inherit"/>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 2. GRAPHIQUE PRINCIPAL : FLUX FINANCIER */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>📊 Flux Financiers (7 derniers jours)</Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff7f7f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff7f7f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="revenus" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="depenses" stroke="#ff7f7f" fillOpacity={1} fill="url(#colorDep)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 3. GRAPHIQUE SECONDAIRE : RÉPARTITION */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>🍰 Top Catégories</Typography>
            {stats.categoryData && stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="80%">
                <Typography color="text.secondary">Aucune donnée de catégorie</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* SECTION ANALYTICS AVANCÉE */}
      <AdminAnalyticsSection />
    </Box>
  );
}

// 🎯 Section Analytics Avancée (Design "Wow")
function AdminAnalyticsSection() {
  // Données simulées (À remplacer par un appel API /admin/stats/growth)
  const growthData = [
    { name: 'Juin', users: 12 },
    { name: 'Juil', users: 19 },
    { name: 'Août', users: 35 },
    { name: 'Sept', users: 58 },
    { name: 'Oct', users: 89 },
    { name: 'Nov', users: 124 },
    { name: 'Déc', users: 156 },
  ];

  const activityData = [
    { name: 'Actifs (7j)', value: 120 },
    { name: 'Dormants', value: 30 },
    { name: 'Bannis', value: 6 },
  ];
  const COLORS_ACTIVITY = ['#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      
      {/* COURBE DE CROISSANCE */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            📈 Croissance des Utilisateurs
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#1976d2" 
                fillOpacity={1} 
                fill="url(#colorUsers)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* CAMEMBERT D'ACTIVITÉ */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            🔍 État de la base
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '90%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ACTIVITY[index % COLORS_ACTIVITY.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

// Petit composant utilitaire pour les cartes KPI
function StatCard({ title, value, icon, color }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={{ height: '100%', borderLeft: `5px solid ${color}` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography color="textSecondary" gutterBottom variant="subtitle2">
                {title}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {value}
              </Typography>
            </Box>
            <Box sx={{ color: color, transform: 'scale(1.5)', opacity: 0.8 }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
