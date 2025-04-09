// src/components/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['Comercial', 'Administrativo', 'Super Usuario'] 
}) => {
  const { user, loading } = useContext(AuthContext);
  
  // Si está cargando, muestra un loader
  if (loading) {
    return <div className="text-center py-5">Cargando...</div>;
  }
  
  // Si no hay usuario autenticado, redirige al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Verifica si el rol del usuario está permitido
  if (!allowedRoles.includes(user.tipo)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Si todo está bien, muestra el contenido
  return children;
};

export default ProtectedRoute;