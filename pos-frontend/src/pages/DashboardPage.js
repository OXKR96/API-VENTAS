// src/pages/DashboardPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Table, Badge, Form, Button, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoneyBillWave, 
  faUsers, 
  faHandHoldingDollar,
  faSearch,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { getDashboardData, getActividad } from '../services/apiService';
import { OfflineContext } from '../context/OfflineContext';
import { AuthContext } from '../context/AuthContext';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    dineroDisponible: 0,
    clientesHoy: 0,
    montoHoy: 0
  });
  
  const [actividad, setActividad] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { isOnline } = useContext(OfflineContext);
  const { userInfo } = useContext(AuthContext);
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getDashboardData(isOnline);
        setDashboardData(data);
        
        // Establecer fechas predeterminadas (últimos 30 días)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        
        setFechaInicio(hace30Dias.toISOString().split('T')[0]);
        setFechaFin(hoy.toISOString().split('T')[0]);
        
        // Cargar actividad con fechas predeterminadas
        const actividadData = await getActividad({
          fechaInicio: hace30Dias.toISOString(),
          fechaFin: hoy.toISOString(),
          limit: 10
        }, isOnline);
        
        setActividad(actividadData);
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, [isOnline]);
  
  // Buscar actividad con filtro de fechas
  const handleSearch = async () => {
    if (!fechaInicio || !fechaFin) return;
    
    try {
      setLoading(true);
      
      const actividadData = await getActividad({
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: new Date(fechaFin).toISOString(),
        limit: 10
      }, isOnline);
      
      setActividad(actividadData);
    } catch (error) {
      console.error('Error cargando actividad:', error);
    } finally {
      setLoading(false);
    }
  };
  
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
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Layout>
      <h2 className="mb-4">Dashboard</h2>
      
      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-primary fa-2x" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Dinero disponible</h6>
                <h3 className="mb-0">{formatMoney(dashboardData.dineroDisponible)}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                <FontAwesomeIcon icon={faUsers} className="text-success fa-2x" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Clientes financiados hoy</h6>
                <h3 className="mb-0">{dashboardData.clientesHoy}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                <FontAwesomeIcon icon={faHandHoldingDollar} className="text-danger fa-2x" />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total monto hoy</h6>
                <h3 className="mb-0">{formatMoney(dashboardData.montoHoy)}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Actividad reciente */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Actividad reciente</h5>
            
            <div className="d-flex">
              <InputGroup className="me-2" style={{ width: '220px' }}>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </InputGroup>
              
              <InputGroup className="me-2" style={{ width: '220px' }}>
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </InputGroup>
              
              <Button variant="primary" onClick={handleSearch}>
                <FontAwesomeIcon icon={faSearch} className="me-1" />
                Buscar
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Cédula</th>
                <th>Nombre cliente</th>
                <th>Fecha</th>
                <th>Monto aprobado</th>
                <th>Estado</th>
                <th>Código entrega</th>
              </tr>
            </thead>
            <tbody>
              {actividad.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                actividad.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>{item.cliente?.cedula}</td>
                    <td>{item.cliente?.nombre} {item.cliente?.apellido}</td>
                    <td>{formatDate(item.fechaAprobacion)}</td>
                    <td>{formatMoney(item.monto)}</td>
                    <td>
                      <Badge bg={item.estado === 'Aprobado' ? 'success' : 'warning'}>
                        {item.estado}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg="dark">{item.codigoEntrega}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default DashboardPage;