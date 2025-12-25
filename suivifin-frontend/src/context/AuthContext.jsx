import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger l'utilisateur au démarrage
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      // Attendre un instant pour que le token soit bien stocké dans localStorage
      await new Promise(resolve => setTimeout(resolve, 100));
      const currentUser = authService.getCurrentUser();
      console.log('✅ Utilisateur après login:', currentUser);
      setUser(currentUser);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      
      // ✅ CORRECTION : Même logique d'extraction d'erreur
      let errorMessage = 'Erreur de connexion';
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.join(', ');
          } else if (typeof error.response.data.errors === 'object') {
            const allErrors = Object.values(error.response.data.errors).flat();
            errorMessage = allErrors.join(', ');
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (email, password, confirmPassword) => {
    try {
      console.log('📝 Tentative inscription:', { email, passwordLength: password?.length });
      const data = await authService.register(email, password, confirmPassword);
      console.log('✅ Inscription réussie:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      console.error('Response data:', error.response?.data);
      
      // ✅ CORRECTION : Extraction unifiée du message d'erreur
      let errorMessage = 'Erreur d\'inscription';
      
      if (error.response?.data) {
        if (error.response.data.message) {
          // Format standard : { message: "..." }
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // Format alternatif : { errors: [...] } ou ModelState
          if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.join(', ');
          } else if (typeof error.response.data.errors === 'object') {
            // ModelState: { "Email": ["error1"], "Password": ["error2"] }
            const allErrors = Object.values(error.response.data.errors).flat();
            errorMessage = allErrors.join(', ');
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
