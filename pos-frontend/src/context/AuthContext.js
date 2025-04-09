
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Correcto con desestructuraciónstalar esta dependencia

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage
    const checkLoggedIn = async () => {
      const storedUser = localStorage.getItem('userInfo');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Verificar si el token ha expirado
          if (userData.token) {
            const isValidToken = checkTokenValidity(userData.token);
            
            if (!isValidToken) {
              // Token expirado
              console.log('Sesión expirada. Por favor inicie sesión nuevamente.');
              logout();
              setIsLoading(false);
              return;
            }
            
            // Configurar axios con el token
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
          }
          
          setUserInfo(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al recuperar sesión:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    checkLoggedIn();
    
    // Configurar interceptor para manejar errores de autenticación
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token inválido o expirado
          logout();
        }
        return Promise.reject(error);
      }
    );
    
    // Limpiar interceptor cuando el componente se desmonte
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Verificar validez del token
  const checkTokenValidity = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Verificar si el token ha expirado
      if (decoded.exp < currentTime) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return false;
    }
  };

  // Renovar token
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh-token', {
        refreshToken: userInfo.refreshToken // Si tienes un refresh token
      });
      
      const { token } = response.data;
      
      // Actualizar token en userInfo
      const updatedUserInfo = {
        ...userInfo,
        token
      };
      
      // Guardar en localStorage
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // Actualizar axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUserInfo(updatedUserInfo);
      
      return true;
    } catch (error) {
      console.error('Error al renovar token:', error);
      logout();
      return false;
    }
  };

  // Verificar y renovar token si es necesario
  const checkAndRefreshToken = async () => {
    if (!userInfo || !userInfo.token) return false;
    
    try {
      const decoded = jwtDecode(userInfo.token);
      const currentTime = Date.now() / 1000;
      
      // Si el token expira en menos de 5 minutos, renovarlo
      if (decoded.exp - currentTime < 300) {
        return await refreshToken();
      }
      
      return true;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return false;
    }
  };

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', { email, password });
      const userData = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('userInfo', JSON.stringify(userData));
      
      // Configurar axios con el token
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      setUserInfo(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      const message = 
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error al iniciar sesión';
      
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
 // En AuthContext.js
const logout = () => {
  // Eliminar token y datos de usuario del localStorage
  localStorage.removeItem('userInfo');
  
  // Eliminar el token de Authorization en los headers de axios
  delete axios.defaults.headers.common['Authorization'];
  
  // Actualizar el estado
  setUserInfo(null);
  setIsAuthenticated(false);
  
  // También puedes añadir un console.log para depuración
  console.log('Usuario cerró sesión correctamente');
};
  // Actualizar información del usuario
  const updateUserInfo = (newUserData) => {
    const updatedUserInfo = { ...userInfo, ...newUserData };
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
    setUserInfo(updatedUserInfo);
  };

  // Verificar si el usuario es administrador o super usuario
  const isAdmin = () => {
    return userInfo && (userInfo.tipo === 'Administrativo' || userInfo.tipo === 'Super Usuario');
  };

  // Verificar permisos específicos
  const hasPermission = (requiredRoles = ['Comercial', 'Administrativo', 'Super Usuario']) => {
    return userInfo && requiredRoles.includes(userInfo.tipo);
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        isLoading,
        isAuthenticated,
        error,
        login,
        logout,
        updateUserInfo,
        isAdmin,
        hasPermission,
        refreshToken,
        checkAndRefreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;