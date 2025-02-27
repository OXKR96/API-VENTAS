import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Configurar interceptor para el token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (credentials) => {
    try {
      const { data } = await axios.post(`${API_URL}/users/login`, credentials);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
      }
      return data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Products
  createProduct: async (product) => {
    const defaultProduct = {
      costPrice: 0,
      category: 'Otros',
      minimumStock: 5,
      taxes: 0,
      isActive: true,
      ...product
    };
    const { data } = await axios.post(`${API_URL}/products`, defaultProduct);
    return data;
  },

  getProducts: async () => {
    const { data } = await axios.get(`${API_URL}/products`);
    return data;
  },

  updateProduct: async (id, product) => {
    const { data } = await axios.put(`${API_URL}/products/${id}`, product);
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await axios.delete(`${API_URL}/products/${id}`);
    return data;
  },

  getLowStockProducts: async () => {
    const { data } = await axios.get(`${API_URL}/products/stock/low`);
    return data;
  },

  getProductStats: async () => {
    const { data } = await axios.get(`${API_URL}/products/stats`);
    return data;
  },

  updateStock: async (id, quantity) => {
    const { data } = await axios.put(`${API_URL}/products/${id}/stock`, { quantity });
    return data;
  },

  // Sales
  createSale: async (sale) => {
    try {
      const saleData = {
        ...sale,
        status: 'Completada',
        taxDetails: {
          taxRate: 0.19,
          subtotal: sale.totalAmount,
          taxAmount: sale.totalAmount * 0.19,
          total: sale.totalAmount * 1.19
        }
      };
      console.log('Datos de venta a enviar:', saleData);
      const { data } = await axios.post(`${API_URL}/sales`, saleData);
      return data;
    } catch (error) {
      console.error('Error en createSale:', error.response?.data || error);
      throw error;
    }
  },

  updateSale: async (id, sale) => {
    try {
      const saleData = {
        ...sale,
        status: 'Completada'
      };
      const { data } = await axios.put(`${API_URL}/sales/${id}`, saleData);
      return data;
    } catch (error) {
      console.error('Error en updateSale:', error.response?.data || error);
      throw error;
    }
  },

  getSales: async () => {
    const { data } = await axios.get(`${API_URL}/sales`);
    return data;
  },

  getSaleById: async (id) => {
    const { data } = await axios.get(`${API_URL}/sales/${id}`);
    return data;
  },

  getSalesByDateRange: async (startDate, endDate) => {
    const { data } = await axios.get(`${API_URL}/sales/date-range?startDate=${startDate}&endDate=${endDate}`);
    return data;
  },

  cancelSale: async (id) => {
    try {
      const { data } = await axios.delete(`${API_URL}/sales/${id}/cancel`);
      return data;
    } catch (error) {
      console.error('Error en cancelSale:', error.response?.data || error);
      throw error;
    }
  },

  getSalesStats: async () => {
    const { data } = await axios.get(`${API_URL}/stats/sales`);
    return data;
  },

  // Suppliers
  getSuppliers: async () => {
    const { data } = await axios.get(`${API_URL}/suppliers`);
    return data;
  },

  createSupplier: async (supplier) => {
    const { data } = await axios.post(`${API_URL}/suppliers`, supplier);
    return data;
  },

  updateSupplier: async (id, supplier) => {
    const { data } = await axios.put(`${API_URL}/suppliers/${id}`, supplier);
    return data;
  },

  deleteSupplier: async (id) => {
    const { data } = await axios.delete(`${API_URL}/suppliers/${id}`);
    return data;
  },

  getSupplierById: async (id) => {
    const { data } = await axios.get(`${API_URL}/suppliers/${id}`);
    return data;
  },

  // Purchases
  getPurchases: async () => {
    const { data } = await axios.get(`${API_URL}/purchases`);
    return data;
  },

  createPurchase: async (purchase) => {
    const { data } = await axios.post(`${API_URL}/purchases`, purchase);
    return data;
  },

  getPurchaseById: async (id) => {
    const { data } = await axios.get(`${API_URL}/purchases/${id}`);
    return data;
  },

  cancelPurchase: async (id) => {
    const { data } = await axios.delete(`${API_URL}/purchases/${id}`);
    return data;
  },

  getPurchaseReport: async (startDate, endDate) => {
    const { data } = await axios.get(`${API_URL}/purchases/reports?startDate=${startDate}&endDate=${endDate}`);
    return data;
  },

  // Dashboard
  getStats: async () => {
    try {
      const [salesStats, debtStats, inventoryStats] = await Promise.all([
        axios.get(`${API_URL}/stats/sales`),
        axios.get(`${API_URL}/stats/debt`),
        axios.get(`${API_URL}/stats/inventory`)
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
  },

  // Customers
  getCustomers: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const { data } = await axios.get(`${API_URL}/customers${queryParams ? `?${queryParams}` : ''}`);
    return data;
  },

  createCustomer: async (customer) => {
    const { data } = await axios.post(`${API_URL}/customers`, customer);
    return data;
  },

  updateCustomer: async (id, customer) => {
    const { data } = await axios.put(`${API_URL}/customers/${id}`, customer);
    return data;
  },

  deleteCustomer: async (id) => {
    const { data } = await axios.delete(`${API_URL}/customers/${id}`);
    return data;
  },

  getCustomerById: async (id) => {
    const { data } = await axios.get(`${API_URL}/customers/${id}`);
    return data;
  },

  getCustomerPendingSales: async (customerId) => {
    const { data } = await axios.get(`${API_URL}/customers/${customerId}/pending-sales`);
    return data;
  },

  registerCustomerPayment: async (customerId, paymentData) => {
    const { data } = await axios.post(`${API_URL}/customers/${customerId}/payments`, paymentData);
    return data;
  },

  getCustomerPaymentHistory: async (customerId) => {
    const { data } = await axios.get(`${API_URL}/customers/${customerId}/payments`);
    return data;
  },

  getDebtStats: async () => {
    const { data } = await axios.get(`${API_URL}/stats/debt`);
    return data;
  },

  // Estadísticas
  getInventoryStats: async () => {
    const { data } = await axios.get(`${API_URL}/stats/inventory`);
    return data;
  },
};