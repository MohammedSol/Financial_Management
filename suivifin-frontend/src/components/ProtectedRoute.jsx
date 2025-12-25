import { Navigate, Outlet } from 'react-router-dom';
import Layout from './Layout';

/**
 * Composant de protection des routes avec contrôle d'accès basé sur les rôles (RBAC)
 * 
 * @param {string[]} allowedRoles - Liste des rôles autorisés à accéder à cette route
 * @param {boolean} requireLayout - Si true, enveloppe le contenu dans le Layout (défaut: true)
 */
function ProtectedRoute({ allowedRoles = null, requireLayout = true }) {
  // Récupérer le token et le rôle depuis localStorage
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  console.log('🔐 ProtectedRoute -', { 
    token: token ? 'Présent' : 'Absent', 
    userRole, 
    allowedRoles 
  });

  // 1️⃣ Vérification : Utilisateur non connecté
  if (!token) {
    console.log('❌ Pas de token, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  // 2️⃣ Vérification : Rôle non autorisé
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`❌ Rôle "${userRole}" non autorisé. Rôles requis:`, allowedRoles);
      console.log('🔄 Redirection vers /dashboard (accès interdit)');
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3️⃣ Accès autorisé
  console.log('✅ Accès autorisé');
  
  // Si requireLayout est true, envelopper dans Layout, sinon juste Outlet
  return requireLayout ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Outlet />
  );
}

export default ProtectedRoute;
