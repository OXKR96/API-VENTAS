// src/pages/OperacionesPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Form, Button, Row, Col, InputGroup, Modal, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faCalendarAlt,
  faMoneyBillWave,
  faHandHoldingDollar,
  faFileInvoiceDollar,
  faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { getActividad } from '../services/apiService';
import { OfflineContext } from '../context/OfflineContext';
import { AuthContext } from '../context/AuthContext';

const OperacionesPage = () => {
  const [operaciones, setOperaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cedula, setCedula] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [submittingAbono, setSubmittingAbono] = useState(false);
  const [abonado, setAbonado] = useState(false);
  
  const { isOnline } = useContext(OfflineContext);
  const { userInfo } = useContext(AuthContext);
  
  // Cargar operaciones iniciales
  useEffect(() => {
    const loadOperaciones = async () => {
      try {
        // Establecer fechas predeterminadas (últimos 30 días)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        
        setFechaInicio(hace30Dias.toISOString().split('T')[0]);
        setFechaFin(hoy.toISOString().split('T')[0]);
        
        // Cargar operaciones con fechas predeterminadas
        const data = await getActividad({
          fechaInicio: hace30Dias.toISOString(),
          fechaFin: hoy.toISOString(),
          limit: 50
        }, isOnline);
        
        setOperaciones(data);
      } catch (error) {
        console.error('Error cargando operaciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOperaciones();
  }, [isOnline]);
  
  // Función para buscar operaciones
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const params = {
        limit: 50
      };
      
      if (fechaInicio && fechaFin) {
        params.fechaInicio = new Date(fechaInicio).toISOString();
        params.fechaFin = new Date(fechaFin).toISOString();
      }
      
      // TODO: Implementar búsqueda por cédula
      
      const data = await getActividad(params, isOnline);
      setOperaciones(data);
    } catch (error) {
      console.error('Error buscando operaciones:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para mostrar modal de abono
  const handleShowAbonoModal = (operacion) => {
    setSelectedOperation(operacion);
    setMontoAbono('');
    setAbonado(false);
    setShowModal(true);
  };
  
  // Función para registrar abono
  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    
    if (!montoAbono || montoAbono <= 0) {
      return;
    }
    
    try {
      setSubmittingAbono(true);
      
      // TODO: Implementar registro de abono con API
      
      // Simulación de registro exitoso
      setTimeout(() => {
        setAbonado(true);
        setSubmittingAbono(false);
      }, 1000);
    } catch (error) {
      console.error('Error registrando abono:', error);
      setSubmittingAbono(false);
    }
  };
  
  // Función para cerrar modal de abono
  const handleCloseModal = () => {
    if (!submittingAbono) {
      setShowModal(false);
      setSelectedOperation(null);
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
      <h2 className="mb-4">Operaciones</h2>
      
      {/* Filtros */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Form>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Rango de fecha</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Cédula</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por cédula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3} className="d-flex align-items-end">
                <Button 
                  variant="primary" 
                  onClick={handleSearch}
                  className="mb-3 w-100"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSearch} className="me-1" />
                  Buscar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      
      {/* Tabla de operaciones */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <h5 className="mb-0">Listado de Operaciones</h5>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operaciones.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-3">
                    {loading ? 'Cargando...' : 'No hay datos disponibles'}
                  </td>
                </tr>
              ) : (
                operaciones.map((item, index) => (
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
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowAbonoModal(item)}
                      >
                        <FontAwesomeIcon icon={faHandHoldingDollar} className="me-1" />
                        Abonar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Modal de Abono */}
      <Modal show={showModal} onHide={handleCloseModal} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Registrar Abono</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {abonado ? (
            <div className="text-center py-3">
              <div className="text-success mb-3">
                <FontAwesomeIcon icon={faCircleCheck} className="fa-5x" />
              </div>
              <h4 className="mb-3">¡Abono Registrado!</h4>
              <p className="mb-2">El abono ha sido registrado exitosamente.</p>
              <Button variant="primary" onClick={handleCloseModal}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              {selectedOperation && (
                <div className="mb-4">
                  <h6>Información del crédito</h6>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td className="fw-bold">Cliente</td>
                        <td>{selectedOperation.cliente?.nombre} {selectedOperation.cliente?.apellido}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Cédula</td>
                        <td>{selectedOperation.cliente?.cedula}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Monto del crédito</td>
                        <td>{formatMoney(selectedOperation.monto)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Valor cuota</td>
                        <td>{formatMoney(selectedOperation.valorCuota || 0)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              )}
              
              <Form onSubmit={handleRegistrarAbono}>
                <Form.Group className="mb-4">
                  <Form.Label>Monto a abonar</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      value={montoAbono}
                      onChange={(e) => setMontoAbono(e.target.value)}
                      min="1000"
                      required
                    />
                  </InputGroup>
                </Form.Group>
                
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="secondary" 
                    onClick={handleCloseModal}
                    disabled={submittingAbono}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="success" 
                    type="submit"
                    disabled={submittingAbono || !montoAbono || montoAbono <= 0}
                  >
                    {submittingAbono ? 'Procesando...' : 'Registrar Abono'}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default OperacionesPage;