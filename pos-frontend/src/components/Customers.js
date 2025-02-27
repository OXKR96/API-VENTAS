import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';

export function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'name'
  });

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  const loadCustomers = async () => {
    try {
      const response = await api.getCustomers(filters);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar la lista de clientes');
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

  const formatDate = (date) => {
    if (!date) return 'No registrado';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  return (
    <div className="container mt-4">
      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o documento..."
                value={filters.search}
                onChange={(e) => setFilters({
                  ...filters,
                  search: e.target.value
                })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({
                  ...filters,
                  status: e.target.value
                })}
              >
                <option value="">Todos</option>
                <option value="AL_DIA">Al Día</option>
                <option value="EN_MORA">En Mora</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Ordenar por</label>
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => setFilters({
                  ...filters,
                  sortBy: e.target.value
                })}
              >
                <option value="name">Nombre</option>
                <option value="debt">Deuda</option>
                <option value="lastPayment">Último Pago</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="card-title mb-0">Clientes</h4>
            <Link to="/customers/new" className="btn btn-primary">
              Nuevo Cliente
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Deuda Total</th>
                  <th>Límite de Crédito</th>
                  <th>Estado</th>
                  <th>Último Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.document}</td>
                    <td>{formatCurrency(customer.totalDebt)}</td>
                    <td>{formatCurrency(customer.creditLimit)}</td>
                    <td>
                      <span className={`badge ${
                        customer.status === 'AL_DIA' ? 'bg-success' :
                        customer.status === 'EN_MORA' ? 'bg-warning' :
                        'bg-danger'
                      }`}>
                        {customer.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{formatDate(customer.lastPaymentDate)}</td>
                    <td>
                      <div className="btn-group">
                        <Link 
                          to={`/customers/${customer._id}/payments`}
                          className="btn btn-sm btn-outline-primary"
                          title="Gestionar Pagos"
                        >
                          <i className="fas fa-money-bill"></i>
                        </Link>
                        <Link 
                          to={`/customers/${customer._id}`}
                          className="btn btn-sm btn-outline-secondary"
                          title="Editar Cliente"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No se encontraron clientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customers; 