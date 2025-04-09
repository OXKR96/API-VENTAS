// src/services/apiService.js
import axios from 'axios';
import * as localStorageService from './localStorageService';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorageService.getItemFromStorage(localStorageService.STORAGE_KEYS.USER_INFO);
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Dashboard
export const getDashboardData = async (isOnline = navigator.onLine) => {
  if (isOnline) {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      // Si falla, intentar datos locales
      return getDashboardDataOffline();
    }
  } else {
    return getDashboardDataOffline();
  }
};

// Función para obtener datos del dashboard offline
const getDashboardDataOffline = () => {
  const creditos = localStorageService.getCreditosFromStorage();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Créditos de hoy
  const creditosHoy = creditos.filter(c => {
    if (!c.fechaAprobacion) return false;
    const fechaCredito = new Date(c.fechaAprobacion);
    return fechaCredito >= today && c.estado === 'Aprobado';
  });
  
  // Calcular montos
  const dineroDisponible = creditos.reduce((total, c) => {
    if (c.estado === 'Aprobado') {
      return total + parseFloat(c.monto || 0);
    }
    return total;
  }, 0);
  
  const montoHoy = creditosHoy.reduce((total, c) => total + parseFloat(c.monto || 0), 0);
  
  return {
    dineroDisponible,
    clientesHoy: creditosHoy.length,
    montoHoy
  };
};

// Actividad
export const getActividad = async (params = {}, isOnline = navigator.onLine) => {
  if (isOnline) {
    try {
      const response = await api.get('/dashboard/actividad', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo actividad:', error);
      return getActividadOffline(params);
    }
  } else {
    return getActividadOffline(params);
  }
};

// Función para obtener actividad offline
const getActividadOffline = (params = {}) => {
  let creditos = localStorageService.getCreditosFromStorage();
  
  // Filtrar por fecha si se proporciona
  if (params.fechaInicio && params.fechaFin) {
    const inicio = new Date(params.fechaInicio);
    const fin = new Date(params.fechaFin);
    
    creditos = creditos.filter(c => {
      if (!c.fechaAprobacion) return false;
      const fecha = new Date(c.fechaAprobacion);
      return fecha >= inicio && fecha <= fin;
    });
  }
  
  // Filtrar por estado
  creditos = creditos.filter(c => c.estado === 'Aprobado');
  
  // Ordenar por fecha descendente
  creditos.sort((a, b) => new Date(b.fechaAprobacion) - new Date(a.fechaAprobacion));
  
  // Limitar cantidad
  const limit = parseInt(params.limit) || 10;
  return creditos.slice(0, limit);
};

// Simulación de crédito
export const simularCredito = async (datos, isOnline = navigator.onLine) => {
  // Lógica de simulación offline por ahora
  const { monto, plazo } = datos;
  
  // Lógica de simulación (igual a la del backend)
  const tasaInteres = 0.025; // 2.5% mensual
  const seguroVida = monto * 0.005; // 0.5% del monto
  
  const valorCuota = (monto * (tasaInteres * Math.pow(1 + tasaInteres, plazo))) / (Math.pow(1 + tasaInteres, plazo) - 1);
  const costoTotal = valorCuota * plazo;
  const intereses = costoTotal - monto;
  
  return {
    monto,
    plazo,
    valorCuota: Math.round(valorCuota),
    intereses: Math.round(intereses),
    seguroVida: Math.round(seguroVida),
    costoTotal: Math.round(costoTotal + seguroVida)
  };
};

// Validación de cliente (simula proceso con Metamap)
export const validarCliente = async (datos, isOnline = navigator.onLine) => {
  // Simular aprobación (80% de probabilidad)
  const aprobado = Math.random() < 0.8;
  
  if (aprobado) {
    // Generar código de verificación
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
    
    return {
      aprobado: true,
      mensaje: 'Cliente validado correctamente (Modo Offline)',
      codigoVerificacion
    };
  } else {
    return {
      aprobado: false,
      mensaje: 'Cliente no ha pasado la validación de identidad (Modo Offline)'
    };
  }
};

// Crear crédito simulado
export const crearCredito = async (datos, isOnline = navigator.onLine) => {
  // Generar código de entrega
  const codigoEntrega = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Datos de ejemplo para modo de desarrollo
  return {
    _id: localStorageService.generateTempId(),
    cliente: datos.clienteData,
    monto: datos.monto,
    plazo: datos.plazo,
    valorCuota: datos.valorCuota,
    codigoVerificacion: datos.codigoVerificacion,
    codigoEntrega,
    estado: 'Aprobado',
    fechaAprobacion: new Date().toISOString(),
    _temp: true
  };
};

export default api;