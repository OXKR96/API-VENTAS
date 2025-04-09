import axios from 'axios';

// Crear una instancia de axios sin redirecciones automáticas
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de respuesta que NO redirecciona automáticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Registramos el error pero NO redireccionamos
    if (error.response && error.response.status === 401) {
      console.error('Error de autenticación:', error.response.data);
      // Eliminar comentario para ver más detalles del error
      // console.log('Detalles completos del error:', error);
    }
    return Promise.reject(error);
  }
);

export default api;