import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import ML from './pages/ML';
import ExportImport from './pages/ExportImport';
import RecurringPayments from './pages/RecurringPayments';
import Forecast from './pages/Forecast';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminTransactions from './pages/admin/AdminTransactions';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* ========== Routes Publiques ========== */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* ========== Routes Protégées (User + Admin) ========== */}
      <Route element={<ProtectedRoute allowedRoles={['User', 'Admin']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/ml" element={<ML />} />
        <Route path="/export-import" element={<ExportImport />} />
        <Route path="/recurring-payments" element={<RecurringPayments />} />
        <Route path="/forecast" element={<Forecast />} />
      </Route>

      {/* ========== Routes Admin Uniquement (avec AdminLayout) ========== */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['Admin']} requireLayout={false} />
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="settings" element={<div>Page Paramètres (à créer)</div>} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
