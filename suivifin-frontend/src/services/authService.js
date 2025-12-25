import api from './api';
import { jwtDecode } from 'jwt-decode';

// Connexion
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { Email: email, Password: password });
  const { token, role } = response.data;
  
  // Stocker le token et le rôle dans localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', role);
  
  return response.data;
};

// Inscription
export const register = async (email, password, confirmPassword) => {
  const response = await api.post('/auth/register', { 
    Email: email, 
    Password: password, 
    ConfirmPassword: confirmPassword 
  });
  return response.data;
};

// Déconnexion
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    // Supprimer le token et le rôle même si l'appel API échoue
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  }
};

// Récupérer l'utilisateur actuel à partir du token
export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    
    // Vérifier si le token est expiré
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      return null;
    }
    
    return {
      userId: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: decoded.email,
      username: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      role: role || 'User'
    };
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    return null;
  }
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};
