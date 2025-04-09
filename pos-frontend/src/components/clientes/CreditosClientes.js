import React, { useState, useEffect } from 'react';
import { Card, Table, Spinner, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const CreditosCliente = ({ clienteId }) => {
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCreditos = async () => {
      if (!clienteId) return;
      
      try {
        setLoading(true);
        
        const api = axios.create({
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Esta ruta debe existir en tu backend para obtener créditos por cliente
        const response = await api.get(`/creditos/cliente/${clienteId}`);
        setCreditos(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar créditos del cliente:', err);
        setError('No se pudieron cargar los créditos del cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditos();
  }, [clienteId]);

  // Formatear valor monetario
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Obtener el color del badge según el estado del crédito
  const getBadgeColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'aprobado':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'rechazado':
        return 'danger';
      case 'pagado':
        return 'info';
      case 'vencido':
        return 'dark';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="border-0 shadow-sm mt-4">
      <Card.Header className="bg-white d-flex align-items-center py-3">
        <h5 className="mb-0">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary me-2" />
          Créditos del Cliente
        </h5>
      </Card.Header>
      <Card.Body className="p-0">
        {error && (
          <div className="alert alert-danger m-3">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : creditos.length === 0 ? (
          <div className="alert alert-info m-3">
            Este cliente no tiene créditos asociados.
          </div>
        ) : (
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Código</th>
                <th>Fecha Aprobación</th>
                <th>Monto</th>
                <th>Plazo</th>
                <th>Estado</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {creditos.map((credito) => (
                <tr key={credito._id}>
                  <td>{credito.codigo || credito._id.substring(0, 8)}</td>
                  <td>{formatDate(credito.fechaAprobacion)}</td>
                  <td>{formatMoney(credito.monto)}</td>
                  <td>{credito.plazo} días</td>
                  <td>
                    <Badge bg={getBadgeColor(credito.estado)}>
                      {credito.estado}
                    </Badge>
                  </td>
                  <td>{formatMoney(credito.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default CreditosCliente;