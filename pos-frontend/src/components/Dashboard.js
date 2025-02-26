import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Productos</h5>
              <h2>{stats.totalProducts}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5 className="card-title">Bajo Stock</h5>
              <h2>{stats.lowStockProducts}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Total Ventas</h5>
              <h2>{stats.totalSales}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Ingresos</h5>
              <h2>${stats.totalRevenue.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;