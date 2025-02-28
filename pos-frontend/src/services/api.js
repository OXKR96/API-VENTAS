import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
api.login = async (credentials) => {
  try {
    const { data } = await api.post('/users/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

api.logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Products
api.createProduct = async (product) => {
  const defaultProduct = {
    costPrice: 0,
    category: 'Otros',
    minimumStock: 5,
    taxes: 0,
    isActive: true,
    ...product
  };
  const { data } = await api.post('/products', defaultProduct);
  return data;
};

api.getProducts = async () => {
  const { data } = await api.get('/products');
  return data;
};

api.updateProduct = async (id, product) => {
  const { data } = await api.put(`/products/${id}`, product);
  return data;
};

api.deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

api.getLowStockProducts = async () => {
  const { data } = await api.get('/products/stock/low');
  return data;
};

api.getProductStats = async () => {
  const { data } = await api.get('/products/stats');
  return data;
};

api.updateStock = async (id, quantity) => {
  const { data } = await api.put(`/products/${id}/stock`, { quantity });
  return data;
};

// Sales
api.createSale = async (sale) => {
  try {
    // Aseguramos que la estructura de la venta sea correcta
    const saleData = {
      ...sale,
      status: 'Completada',
      items: sale.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        subtotal: item.subtotal
      })),
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      customerId: sale.customerId,
      date: sale.date
    };

    console.log('Datos de venta a enviar:', saleData);
    const { data } = await api.post('/sales', saleData);
    return data;
  } catch (error) {
    console.error('Error en createSale:', error.response?.data || error);
    throw error;
  }
};

api.updateSale = async (id, sale) => {
  try {
    const saleData = {
      ...sale,
      status: 'Completada'
    };
    const { data } = await api.put(`/sales/${id}`, saleData);
    return data;
  } catch (error) {
    console.error('Error en updateSale:', error.response?.data || error);
    throw error;
  }
};

api.getSales = async (filters = {}) => {
  try {
    // Construir los parámetros de consulta
    const params = new URLSearchParams();
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.dateRange?.start) {
      params.append('startDate', filters.dateRange.start);
    }
    
    if (filters.dateRange?.end) {
      params.append('endDate', filters.dateRange.end);
    }
    
    if (filters.saleType) {
      params.append('saleType', filters.saleType);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }

    // Agregar ordenamiento por fecha de creación descendente
    params.append('sort', '-createdAt');

    const { data } = await api.get(`/sales?${params.toString()}`);
    console.log('Datos brutos de la API:', data);
    
    // Asegurarnos de que data sea un array
    const sales = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
    console.log('Ventas procesadas:', sales);
    
    return {
      success: true,
      data: sales
    };
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};

api.getSaleById = async (id) => {
  const { data } = await api.get(`/sales/${id}`);
  return data;
};

api.getSalesByDateRange = async (startDate, endDate) => {
  const { data } = await api.get(`/sales/date-range?startDate=${startDate}&endDate=${endDate}`);
  return data;
};

api.cancelSale = async (id) => {
  try {
    const { data } = await api.delete(`/sales/${id}`);
    return {
      success: true,
      message: 'Venta cancelada exitosamente',
      data
    };
  } catch (error) {
    console.error('Error al cancelar la venta:', error);
    throw error;
  }
};

api.getSalesStats = async () => {
  const { data } = await api.get('/stats/sales');
  return data;
};

// Suppliers
api.getSuppliers = async () => {
  const { data } = await api.get('/suppliers');
  return data;
};

api.createSupplier = async (supplier) => {
  const { data } = await api.post('/suppliers', supplier);
  return data;
};

api.updateSupplier = async (id, supplier) => {
  const { data } = await api.put(`/suppliers/${id}`, supplier);
  return data;
};

api.deleteSupplier = async (id) => {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
};

api.getSupplierById = async (id) => {
  const { data } = await api.get(`/suppliers/${id}`);
  return data;
};

// Purchases
api.getPurchases = async (filters = {}) => {
  const { startDate, endDate, status, paymentMethod, search } = filters;
  const params = new URLSearchParams();
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (status) params.append('status', status);
  if (paymentMethod) params.append('paymentMethod', paymentMethod);
  if (search) params.append('search', search);

  const response = await api.get(`/purchases?${params.toString()}`);
  return response.data;
};

api.createPurchase = async (purchaseData) => {
  const response = await api.post('/purchases', purchaseData);
  return response.data;
};

api.getPurchaseById = async (purchaseId) => {
  const response = await api.get(`/purchases/${purchaseId}`);
  return response.data;
};

api.cancelPurchase = async (purchaseId) => {
  const response = await api.put(`/purchases/${purchaseId}/cancel`);
  return response.data;
};

api.getPurchaseReport = async (startDate, endDate) => {
  const { data } = await api.get(`/purchases/reports?startDate=${startDate}&endDate=${endDate}`);
  return data;
};

// Dashboard
api.getStats = async () => {
  try {
    const [salesStats, debtStats, inventoryStats] = await Promise.all([
      api.get('/stats/sales'),
      api.get('/stats/debt'),
      api.get('/stats/inventory')
    ]);
    return {
      salesStats: salesStats.data,
      debtStats: debtStats.data,
      inventoryStats: inventoryStats.data
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};

// Customers
api.getCustomers = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/customers${queryParams ? `?${queryParams}` : ''}`);
    return data;
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

api.createCustomer = async (customerData) => {
  try {
    console.log('API - Datos enviados:', customerData);
    const { data } = await api.post('/customers', customerData);
    return data;
  } catch (error) {
    console.error('API - Error:', error.response?.data);
    throw error;
  }
};

api.updateCustomer = async (id, customer) => {
  try {
    const { data } = await api.put(`/customers/${id}`, customer);
    return data;
  } catch (error) {
    console.error('API - Error updating customer:', error);
    throw error;
  }
};

api.deleteCustomer = async (id) => {
  const { data } = await api.delete(`/customers/${id}`);
  return data;
};

api.getCustomerById = async (id) => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

api.getCustomerPendingSales = async (customerId) => {
  const { data } = await api.get(`/customers/${customerId}/pending-sales`);
  return data;
};

api.registerCustomerPayment = async (customerId, paymentData) => {
  try {
    const { data } = await api.post(`/customers/${customerId}/payments`, paymentData);
    return data;
  } catch (error) {
    console.error('API - Error registering payment:', error);
    throw error;
  }
};

api.getCustomerPaymentHistory = async (customerId) => {
  const { data } = await api.get(`/customers/${customerId}/payments`);
  return data;
};

api.getDebtStats = async () => {
  const { data } = await api.get('/stats/debt');
  return data;
};

// Estadísticas
api.getInventoryStats = async () => {
  const { data } = await api.get('/stats/inventory');
  return data;
};