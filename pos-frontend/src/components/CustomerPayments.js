import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'react-toastify';

export function CustomerPayments() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [pendingSales, setPendingSales] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Efectivo',
    notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    try {
      const [customerData, salesData, historyData] = await Promise.all([
        api.getCustomerById(id),
        api.getCustomerPendingSales(id),
        api.getCustomerPaymentHistory(id)
      ]);

      setCustomer(customerData.data);
      setPendingSales(salesData.data);
      setPaymentHistory(historyData.data);
    } catch (error) {
      console.error('Error al cargar datos del cliente:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSale) {
      toast.error('Por favor seleccione una venta');
      return;
    }

    try {
      await api.registerCustomerPayment(id, {
        saleId: selectedSale._id,
        ...paymentData
      });

      toast.success('Pago registrado exitosamente');
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'Efectivo',
        notes: ''
      });
      loadCustomerData();
    } catch (error) {
      console.error('Error al registrar el pago:', error);
      toast.error(error.response?.data?.message || 'Error al registrar el pago');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="container mt-4">
      {/* Información del Cliente */}
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Información del Cliente</h4>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Nombre:</strong> {customer?.name}</p>
              <p><strong>Documento:</strong> {customer?.document}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Deuda Total:</strong> {formatCurrency(customer?.totalDebt || 0)}</p>
              <p>
                <strong>Estado:</strong>
                <span className={`badge ms-2 ${
                  customer?.status === 'AL_DIA' ? 'bg-success' :
                  customer?.status === 'EN_MORA' ? 'bg-warning' :
                  'bg-danger'
                }`}>
                  {customer?.status?.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ventas Pendientes */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="card-title mb-0">Ventas Pendientes</h4>
            <button 
              className="btn btn-primary"
              onClick={() => setShowPaymentModal(true)}
              disabled={pendingSales.length === 0}
            >
              Registrar Pago
            </button>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingSales.map(sale => (
                  <tr key={sale._id}>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>{formatCurrency(sale.totalAmount)}</td>
                    <td>{formatCurrency(sale.totalAmount - sale.remainingAmount)}</td>
                    <td>{formatCurrency(sale.remainingAmount)}</td>
                    <td>
                      <span className={`badge ${
                        sale.paymentStatus === 'Pagado' ? 'bg-success' :
                        sale.paymentStatus === 'Parcial' ? 'bg-warning' :
                        'bg-danger'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setSelectedSale(sale);
                          setPaymentData({
                            ...paymentData,
                            amount: sale.remainingAmount
                          });
                          setShowPaymentModal(true);
                        }}
                      >
                        Pagar
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingSales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No hay ventas pendientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Historial de Pagos</h4>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment, index) => (
                  <tr key={index}>
                    <td>{formatDate(payment.date)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{payment.notes}</td>
                  </tr>
                ))}
                {paymentHistory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No hay pagos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Registrar Pago</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSale(null);
                    setPaymentData({
                      amount: '',
                      paymentMethod: 'Efectivo',
                      notes: ''
                    });
                  }}
                ></button>
              </div>
              <form onSubmit={handlePaymentSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Venta</label>
                    <select 
                      className="form-select"
                      value={selectedSale?._id || ''}
                      onChange={(e) => {
                        const sale = pendingSales.find(s => s._id === e.target.value);
                        setSelectedSale(sale);
                        setPaymentData({
                          ...paymentData,
                          amount: sale.remainingAmount
                        });
                      }}
                      required
                    >
                      <option value="">Seleccionar venta...</option>
                      {pendingSales.map(sale => (
                        <option key={sale._id} value={sale._id}>
                          {formatDate(sale.createdAt)} - Pendiente: {formatCurrency(sale.remainingAmount)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Monto</label>
                    <input
                      type="number"
                      className="form-control"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        amount: parseFloat(e.target.value)
                      })}
                      max={selectedSale?.remainingAmount}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Método de Pago</label>
                    <select
                      className="form-select"
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        paymentMethod: e.target.value
                      })}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notas</label>
                    <textarea
                      className="form-control"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({
                        ...paymentData,
                        notes: e.target.value
                      })}
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedSale(null);
                      setPaymentData({
                        amount: '',
                        paymentMethod: 'Efectivo',
                        notes: ''
                      });
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 