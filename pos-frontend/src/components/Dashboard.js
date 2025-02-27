import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    salesStats: {
      totalSales: 0,
      monthlySales: [],
      averageTicket: 0,
      totalTransactions: 0,
      topProducts: [],
      salesByDayOfWeek: []
    },
    customerStats: {
      totalCustomers: 0,
      totalDebt: 0,
      customersByStatus: {
        AL_DIA: 0,
        EN_MORA: 0,
        BLOQUEADO: 0
      },
      debtRanges: [],
      topDebtors: []
    },
    inventoryStats: {
      totalProducts: 0,
      totalValue: 0,
      categoryStats: [],
      stockStatus: [],
      lowStock: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { salesStats, debtStats, inventoryStats } = await api.getStats();

      setStats({
        salesStats: {
          totalSales: salesStats?.data?.totalSales || 0,
          monthlySales: salesStats?.data?.monthlySales || [],
          averageTicket: salesStats?.data?.averageTicket || 0,
          totalTransactions: salesStats?.data?.totalTransactions || 0,
          topProducts: salesStats?.data?.topProducts || [],
          salesByDayOfWeek: salesStats?.data?.salesByDayOfWeek || []
        },
        customerStats: {
          totalCustomers: debtStats?.data?.totalCustomers || 0,
          totalDebt: debtStats?.data?.totalDebt || 0,
          customersByStatus: debtStats?.data?.customersByStatus || {
            AL_DIA: 0,
            EN_MORA: 0,
            BLOQUEADO: 0
          },
          debtRanges: debtStats?.data?.debtRanges || [],
          topDebtors: debtStats?.data?.topDebtors || []
        },
        inventoryStats: {
          totalProducts: inventoryStats?.data?.totalProducts || 0,
          totalValue: inventoryStats?.data?.totalValue || 0,
          categoryStats: inventoryStats?.data?.categoryStats || [],
          stockStatus: inventoryStats?.data?.stockStatus || [],
          lowStock: inventoryStats?.data?.lowStock || []
        }
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar las estadísticas del dashboard');
      toast.error('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  const monthlySalesData = {
    labels: stats.salesStats?.monthlySales?.map(sale => sale.month) || [],
    datasets: [{
      label: 'Ventas Mensuales',
      data: stats.salesStats?.monthlySales?.map(sale => sale.total) || [],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const customerStatusData = {
    labels: ['Al Día', 'En Mora', 'Bloqueados'],
    datasets: [{
      data: [
        stats.customerStats?.customersByStatus?.AL_DIA || 0,
        stats.customerStats?.customersByStatus?.EN_MORA || 0,
        stats.customerStats?.customersByStatus?.BLOQUEADO || 0
      ],
      backgroundColor: [
        'rgb(75, 192, 192)',
        'rgb(255, 205, 86)',
        'rgb(255, 99, 132)'
      ]
    }]
  };

  const stockStatusData = {
    labels: ['Sin Stock', 'Bajo Stock', 'Stock Moderado', 'Stock Suficiente'],
    datasets: [{
      data: stats.inventoryStats.stockStatus.map(status => status.count),
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 205, 86)',
        'rgb(54, 162, 235)',
        'rgb(75, 192, 192)'
      ]
    }]
  };

  // Estilos personalizados
  const cardStyles = {
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    border: 'none'
  };

  const hoverStyles = {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
  };

  const gradients = {
    sales: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    debt: 'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',
    inventory: 'linear-gradient(135deg, #00B09B 0%, #96C93D 100%)',
    lowStock: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)'
  };

  const handleCardClick = (module) => {
    switch(module) {
      case 'sales':
        navigate('/sales');
        break;
      case 'customers':
        navigate('/customers');
        break;
      case 'inventory':
        navigate('/products');
        break;
      case 'products':
        navigate('/products');
        break;
    }
  };

  return (
    <div className="container-fluid p-3" style={{ background: '#f8f9fa', minHeight: '92vh', maxHeight: '92vh' }}>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Primera fila - Tarjetas principales */}
      <div className="row g-3" style={{ height: '180px', marginBottom: '1rem' }}>
        <div className="col-md-3">
          <div 
            className="card h-100" 
            style={{
              ...cardStyles,
              background: gradients.sales
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyles)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyles)}
            onClick={() => handleCardClick('sales')}
          >
            <div className="card-body text-white p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title mb-2 text-white-50">Ventas Totales</h6>
                  <h3 className="card-text mb-2">{formatCurrency(stats.salesStats?.totalSales || 0)}</h3>
                  <div className="small">
                    <div>Ticket Promedio: {formatCurrency(stats.salesStats?.averageTicket || 0)}</div>
                    <div>Transacciones: {stats.salesStats?.totalTransactions || 0}</div>
                  </div>
                </div>
                <i className="fas fa-chart-line fa-2x text-white-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div 
            className="card h-100" 
            style={{
              ...cardStyles,
              background: gradients.debt
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyles)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyles)}
            onClick={() => handleCardClick('customers')}
          >
            <div className="card-body text-white p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title mb-2 text-white-50">Deuda Total</h6>
                  <h3 className="card-text mb-2">{formatCurrency(stats.customerStats?.totalDebt || 0)}</h3>
                  <div className="small">
                    <div>Clientes: {stats.customerStats?.totalCustomers || 0}</div>
                    <div>En Mora: {stats.customerStats?.customersByStatus?.EN_MORA || 0}</div>
                  </div>
                </div>
                <i className="fas fa-users fa-2x text-white-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div 
            className="card h-100" 
            style={{
              ...cardStyles,
              background: gradients.inventory
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyles)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyles)}
            onClick={() => handleCardClick('inventory')}
          >
            <div className="card-body text-white p-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="card-title mb-2 text-white-50">Inventario</h6>
                  <h3 className="card-text mb-2">{formatCurrency(stats.inventoryStats?.totalValue || 0)}</h3>
                  <div className="small">
                    <div>Productos: {stats.inventoryStats?.totalProducts || 0}</div>
                    <div>Bajo Stock: {stats.inventoryStats?.lowStock?.length || 0}</div>
                  </div>
                </div>
                <i className="fas fa-box fa-2x text-white-50"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card h-100" style={cardStyles}>
            <div className="card-body p-3">
              <h6 className="card-title mb-2">Estado de Clientes</h6>
              <div style={{ height: '120px' }}>
                <Pie data={customerStatusData} options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 10,
                        padding: 5,
                        font: {
                          size: 11
                        }
                      }
                    }
                  }
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila - Gráficos y tablas */}
      <div className="row g-3" style={{ height: 'calc(92vh - 220px)' }}>
        <div className="col-md-8">
          <div className="card h-100" style={cardStyles}>
            <div className="card-body p-3">
              <h6 className="card-title d-flex justify-content-between align-items-center mb-3">
                Tendencia de Ventas
                <span className="badge bg-success">{formatCurrency(stats.salesStats?.totalSales || 0)}</span>
              </h6>
              <div style={{ height: '45%', marginBottom: '1rem' }}>
                <Line data={monthlySalesData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }} />
              </div>

              <div className="row" style={{ height: '45%' }}>
                <div className="col-md-6">
                  <h6 className="card-title">Top Productos</h6>
                  <div className="table-responsive" style={{ maxHeight: 'calc(100% - 30px)' }}>
                    <table className="table table-sm">
                      <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                        <tr>
                          <th>Producto</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.salesStats.topProducts.slice(0, 4).map((product, index) => (
                          <tr key={index}>
                            <td>{product.name}</td>
                            <td>{formatCurrency(product.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6 className="card-title">Principales Deudores</h6>
                  <div className="table-responsive" style={{ maxHeight: 'calc(100% - 30px)' }}>
                    <table className="table table-sm">
                      <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                        <tr>
                          <th>Cliente</th>
                          <th>Deuda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.customerStats.topDebtors.slice(0, 4).map((debtor, index) => (
                          <tr key={index}>
                            <td>{debtor.name}</td>
                            <td>{formatCurrency(debtor.debt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100" style={cardStyles}>
            <div className="card-body p-3">
              <h6 className="card-title mb-3">Productos Críticos</h6>
              <div className="table-responsive" style={{ height: 'calc(100% - 40px)' }}>
                <table className="table table-sm">
                  <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <tr>
                      <th>Producto</th>
                      <th>Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.inventoryStats.lowStock.slice(0, 8).map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className={`badge ${
                            product.status === 'Sin Stock' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;