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
    const { data } = await axios.post(`${API_URL}/sales`, {
      ...sale,
      status: 'Completada',
      taxDetails: {
        taxRate: 0.19,
        subtotal: sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }
    });
    return data;
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
    const { data } = await axios.delete(`${API_URL}/sales/${id}`);
    return data;
  },

  getSalesStats: async () => {
    const { data } = await axios.get(`${API_URL}/sales/stats`);
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
      const [products, sales] = await Promise.all([
        axios.get(`${API_URL}/products/count`),
        axios.get(`${API_URL}/sales/stats`)
      ]);
      return {
        totalProducts: products.data.count,
        lowStockProducts: products.data.lowStockCount,
        totalSales: sales.data.totalSales,
        totalRevenue: sales.data.totalRevenue
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        totalSales: 0,
        totalRevenue: 0
      };
    }
  }
};