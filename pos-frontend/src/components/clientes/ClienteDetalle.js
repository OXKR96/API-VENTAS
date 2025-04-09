import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faIdCard, 
  faUser, 
  faPhone, 
  faEnvelope, 
  faMapMarkerAlt, 
  faBirthdayCake,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const ClienteDetalle = ({ cliente }) => {
  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No registrada';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!cliente) {
    return <div className="alert alert-info">No hay datos de cliente para mostrar</div>;
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex align-items-center py-3">
        <h5 className="mb-0">
          <FontAwesomeIcon icon={faUser} className="text-primary me-2" />
          Información del Cliente
        </h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6} className="mb-3">
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faIdCard} />
              </div>
              <div>
                <div className="text-muted small">Cédula</div>
                <div className="fw-bold">{cliente.cedula}</div>
              </div>
            </div>
          </Col>
          <Col md={6} className="mb-3">
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faBirthdayCake} />
              </div>
              <div>
                <div className="text-muted small">Fecha de Nacimiento</div>
                <div>{formatDate(cliente.fechaNacimiento)}</div>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col md={6} className="mb-3">
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div>
                <div className="text-muted small">Nombre Completo</div>
                <div className="fw-bold">{cliente.nombre} {cliente.apellido}</div>
              </div>
            </div>
          </Col>
          <Col md={6} className="mb-3">
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faPhone} />
              </div>
              <div>
                <div className="text-muted small">Teléfono</div>
                <div>{cliente.telefono || 'No registrado'}</div>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col md={6} className="mb-3">
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div>
                <div className="text-muted small">Email</div>
                <div>{cliente.email || 'No registrado'}</div>
              </div>
            </div>
          </Col>
          <Col md={6} className="mb-3">
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </div>
              <div>
                <div className="text-muted small">Dirección</div>
                <div>{cliente.direccion || 'No registrada'}</div>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row>
          <Col>
            <div className="d-flex">
              <div className="text-muted me-2">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
              <div>
                <div className="text-muted small">Fecha de Registro</div>
                <Badge bg="light" text="dark">
                  {formatDate(cliente.fechaCreacion)}
                </Badge>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ClienteDetalle;