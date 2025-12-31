import axios from 'axios';

// Fonction pour convertir camelCase en PascalCase
const toPascalCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toPascalCase);
  
  return Object.keys(obj).reduce((result, key) => {
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    result[pascalKey] = toPascalCase(obj[key]);
    return result;
  }, {});
};

// Fonction pour convertir PascalCase en camelCase
const toCamelCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  return Object.keys(obj).reduce((result, key) => {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    result[camelKey] = toCamelCase(obj[key]);
    return result;
  }, {});
};

const api = axios.create({
  baseURL: 'http://localhost:5161/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur : ajouter le token JWT et convertir en PascalCase
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Convertir les données en PascalCase pour le backend
    if (config.data && typeof config.data === 'object') {
      config.data = toPascalCase(config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur : gérer les erreurs d'authentification et convertir en camelCase
api.interceptors.response.use(
  (response) => {
    // 🛑 CORRECTIF : Si c'est un fichier (Blob), on le retourne tel quel sans le modifier
    if (response.data instanceof Blob || response.config.responseType === 'blob') {
      return response;
    }

    // Convertir les données reçues en camelCase (seulement pour le JSON)
    if (response.data && typeof response.data === 'object') {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
