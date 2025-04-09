// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthProvider from './context/AuthContext';
import OfflineProvider from './context/OfflineContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/DashboardPage';
import SimuladorPage from './pages/SimuladorPage';
import OperacionesPage from './pages/OperacionesPage';
import SucursalesPage from './pages/SucursalesPage';
import LiquidacionPage from './pages/LiquidacionPage';
import ClientesPage from './pages/ClientesPage';
import UsuariosPage from './pages/UsuariosPage';
import './styles/styles.css';

const App = () => {
  return (
    <AuthProvider>
      <OfflineProvider>
        <BrowserRouter>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Rutas para todos los usuarios (Comercial, Administrativo, Super Usuario) */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/simulador"
              element={
                <PrivateRoute>
                  <SimuladorPage />
                </PrivateRoute>
              }
            />
            
            {/* Rutas para Administrativo y Super Usuario */}
            <Route
              path="/operaciones"
              element={
                <PrivateRoute allowedRoles={['Administrativo', 'Super Usuario']}>
                  <OperacionesPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/sucursales"
              element={
                <PrivateRoute allowedRoles={['Administrativo', 'Super Usuario']}>
                  <SucursalesPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/liquidacion"
              element={
                <PrivateRoute allowedRoles={['Administrativo', 'Super Usuario']}>
                  <LiquidacionPage />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/clientes"
              element={
                <PrivateRoute allowedRoles={['Administrativo', 'Super Usuario']}>
                  <ClientesPage />
                </PrivateRoute>
              }
            />
            
            {/* Rutas solo para Super Usuario y Administrativo */}
            <Route
              path="/usuarios"
              element={
                <PrivateRoute allowedRoles={['Super Usuario', 'Administrativo']}>
                  <UsuariosPage />
                </PrivateRoute>
              }
            />
            
            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </OfflineProvider>
    </AuthProvider>
  );
};

export default App;