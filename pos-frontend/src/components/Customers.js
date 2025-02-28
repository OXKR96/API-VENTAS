import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { Table } from './common/Table';

export function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'name'
  });
  
  const [modalConfig, setModalConfig] = useState({
    show: false,
    type: null, // 'create', 'edit', 'payment', 'invoices', 'invoice-detail'
    title: '',
    data: null
  });

  const [currentCustomer, setCurrentCustomer] = useState({
    name: '',
    document: '',
    creditLimit: '',
    totalDebt: 0,
    status: 'AL_DIA',
    lastPaymentDate: null,
    email: '',
    address: '',
    phone: ''
  });

  const [payment, setPayment] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Efectivo',
    notes: ''
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await api.getCustomers(filters);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleOpenModal = (type, customer = null) => {
    const titles = {
      create: 'Nuevo Cliente',
      edit: 'Editar Cliente',
      payment: 'Registrar Pago',
      invoices: 'Facturas del Cliente',
      'invoice-detail': 'Detalle de Factura'
    };

    if (type === 'invoices') {
      loadCustomerInvoices(customer._id);
    }

    if (customer) {
      setCurrentCustomer(customer);
    } else {
      resetForm();
    }

    setModalConfig({
      show: true,
      type,
      title: titles[type],
      data: customer
    });
  };

  const handleCloseModal = () => {
    setModalConfig({
      show: false,
      type: null,
      title: '',
      data: null
    });
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Formatear los datos según el modelo del backend
      const customerData = {
        name: currentCustomer.name.trim(),
        document: currentCustomer.document.trim(),
        creditLimit: parseFloat(currentCustomer.creditLimit),
        status: currentCustomer.status,
        currentDebt: 0,
        paymentHistory: [],
        lastPaymentDate: null,
        email: currentCustomer.email.trim(),
        address: currentCustomer.address.trim(),
        phone: currentCustomer.phone.trim()
      };

      // Validaciones
      if (!customerData.name || !customerData.document || !customerData.creditLimit || 
          !customerData.email || !customerData.address || !customerData.phone) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }

      if (customerData.creditLimit <= 0) {
        toast.error('El límite de crédito debe ser mayor a 0');
        return;
      }

      console.log('Enviando datos:', customerData);

      if (modalConfig.data?._id) {
        const response = await api.updateCustomer(modalConfig.data._id, customerData);
        console.log('Respuesta update:', response);
        toast.success('Cliente actualizado exitosamente');
      } else {
        const response = await api.createCustomer(customerData);
        console.log('Respuesta create:', response);
        toast.success('Cliente creado exitosamente');
      }
      
      handleCloseModal();
      loadCustomers();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error al procesar la operación');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        amount: Number(payment.amount),
        type: 'PAGO', // Tipo requerido por el backend
        description: payment.notes || 'Pago regular',
        date: payment.date
      };

      await api.registerCustomerPayment(currentCustomer._id, paymentData);
      toast.success('Pago registrado exitosamente');
      handleCloseModal();
      loadCustomers();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar el pago');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      try {
        await api.deleteCustomer(id);
        toast.success('Cliente eliminado exitosamente');
        loadCustomers();
      } catch (error) {
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  const resetForm = () => {
    setCurrentCustomer({
      name: '',
      document: '',
      creditLimit: '',
      totalDebt: 0,
      status: 'AL_DIA',
      lastPaymentDate: null,
      email: '',
      address: '',
      phone: ''
    });
    setPayment({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Efectivo',
      notes: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0);
  };

  const loadCustomerInvoices = async (customerId) => {
    try {
      const response = await api.getCustomerPendingSales(customerId);
      setCustomerInvoices(response.data);
    } catch (error) {
      toast.error('Error al cargar las facturas del cliente');
    }
  };

  const handleViewInvoiceDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setModalConfig({
      show: true,
      type: 'invoice-detail',
      title: `Factura #${invoice.number}`,
      data: invoice
    });
  };

  const renderInvoicesModal = () => {
    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customerInvoices.map(invoice => (
              <tr key={invoice._id}>
                <td>{invoice.number}</td>
                <td>{new Date(invoice.date).toLocaleDateString('es-ES')}</td>
                <td>{formatCurrency(invoice.total)}</td>
                <td>
                  <span className={`badge ${
                    invoice.status === 'PAGADA' ? 'bg-success' :
                    invoice.status === 'PENDIENTE' ? 'bg-warning' :
                    'bg-danger'
                  }`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => handleViewInvoiceDetail(invoice)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
            {customerInvoices.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">
                  No hay facturas pendientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInvoiceDetailModal = () => {
    if (!selectedInvoice) return null;

    return (
      <div>
        <div className="row mb-3">
          <div className="col-md-6">
            <h6>Información de la Factura</h6>
            <p><strong>Número:</strong> {selectedInvoice.number}</p>
            <p><strong>Fecha:</strong> {new Date(selectedInvoice.date).toLocaleDateString('es-ES')}</p>
            <p><strong>Estado:</strong> {selectedInvoice.status}</p>
          </div>
          <div className="col-md-6">
            <h6>Cliente</h6>
            <p><strong>Nombre:</strong> {currentCustomer.name}</p>
            <p><strong>Documento:</strong> {currentCustomer.document}</p>
          </div>
        </div>

        <h6>Detalle de Productos</h6>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.product.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                <td>{formatCurrency(selectedInvoice.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderModalContent = () => {
    if (!modalConfig.show) return null;

    switch (modalConfig.type) {
      case 'payment':
        return renderPaymentForm();
      case 'invoices':
        return renderInvoicesModal();
      case 'invoice-detail':
        return renderInvoiceDetailModal();
      default:
        return renderCustomerForm();
    }
  };

  const renderPaymentForm = () => {
    return (
      <form onSubmit={handlePaymentSubmit}>
        <div className="mb-3">
          <label className="form-label">Cliente</label>
          <input
            type="text"
            className="form-control"
            value={currentCustomer.name}
            disabled
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Deuda Actual</label>
          <input
            type="text"
            className="form-control"
            value={formatCurrency(currentCustomer.totalDebt)}
            disabled
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Monto a Pagar *</label>
          <input
            type="number"
            className="form-control"
            value={payment.amount}
            onChange={(e) => setPayment({
              ...payment,
              amount: e.target.value
            })}
            required
            min="0"
            max={currentCustomer.totalDebt}
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Método de Pago</label>
          <select
            className="form-select"
            value={payment.paymentMethod}
            onChange={(e) => setPayment({
              ...payment,
              paymentMethod: e.target.value
            })}
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha de Pago</label>
          <input
            type="date"
            className="form-control"
            value={payment.date}
            onChange={(e) => setPayment({
              ...payment,
              date: e.target.value
            })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Notas</label>
          <textarea
            className="form-control"
            value={payment.notes}
            onChange={(e) => setPayment({
              ...payment,
              notes: e.target.value
            })}
            rows="3"
          ></textarea>
        </div>
      </form>
    );
  };

  const renderCustomerForm = () => {
    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            className="form-control"
            value={currentCustomer.name}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              name: e.target.value
            })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email *</label>
          <input
            type="email"
            className="form-control"
            value={currentCustomer.email}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              email: e.target.value
            })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Teléfono *</label>
          <input
            type="tel"
            className="form-control"
            value={currentCustomer.phone}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              phone: e.target.value
            })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Dirección *</label>
          <input
            type="text"
            className="form-control"
            value={currentCustomer.address}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              address: e.target.value
            })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Documento *</label>
          <input
            type="text"
            className="form-control"
            value={currentCustomer.document}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              document: e.target.value
            })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Límite de Crédito *</label>
          <input
            type="number"
            className="form-control"
            value={currentCustomer.creditLimit}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              creditLimit: e.target.value
            })}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            value={currentCustomer.status}
            onChange={(e) => setCurrentCustomer({
              ...currentCustomer,
              status: e.target.value
            })}
          >
            <option value="AL_DIA">Al Día</option>
            <option value="EN_MORA">En Mora</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Clientes</h2>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal('create')}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Cliente
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o documento..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="AL_DIA">Al Día</option>
                <option value="EN_MORA">En Mora</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="name">Ordenar por Nombre</option>
                <option value="totalDebt">Ordenar por Deuda</option>
                <option value="lastPaymentDate">Ordenar por Último Pago</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
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
                    <td>{formatCurrency(customer.currentDebt)}</td>
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
                    <td>
                      {customer.lastPaymentDate
                        ? new Date(customer.lastPaymentDate).toLocaleDateString('es-ES')
                        : 'No registrado'}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenModal('edit', customer)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleOpenModal('payment', customer)}
                          disabled={!customer.currentDebt}
                          title={customer.currentDebt ? "Registrar Pago" : "No tiene deuda pendiente"}
                        >
                          <i className="fas fa-dollar-sign"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-info"
                          onClick={() => handleOpenModal('invoices', customer)}
                          title="Ver Facturas"
                        >
                          <i className="fas fa-file-invoice"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(customer._id)}
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No hay clientes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`modal fade ${modalConfig.show ? 'show' : ''}`} 
           style={{ display: modalConfig.show ? 'block' : 'none' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{modalConfig.title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
              ></button>
            </div>
            <div className="modal-body">
              {renderModalContent()}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => document.querySelector('form').requestSubmit()}
              >
                {modalConfig.type === 'payment' ? 'Registrar Pago' : 
                 modalConfig.type === 'edit' ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {modalConfig.show && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default Customers; 