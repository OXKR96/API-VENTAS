// src/pages/LoginPage.js
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';

// Logo SVG inline en vez de importar una imagen
const Logo = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="60" rx="10" fill="#0047AB" />
    <path d="M16 30C16 22.268 22.268 16 30 16C37.732 16 44 22.268 44 30C44 37.732 37.732 44 30 44C22.268 44 16 37.732 16 30Z" fill="white" />
    <path d="M22 25H38V28H22V25Z" fill="#0047AB" />
    <path d="M22 31H38V34H22V31Z" fill="#0047AB" />
    <path d="M22 37H38V40H22V37Z" fill="#0047AB" />
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, isLoading, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    if (!email.trim() || !password.trim()) {
      setFormError('Por favor ingrese email y contraseña');
      return;
    }
    
    // Limpiar error
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setFormError(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      setFormError(error.message || 'Error inesperado al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  
  return (
    <Container fluid className="vh-100 bg-light d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <Logo />
                  </div>
                  <h3 className="fw-bold text-primary">CREDITOS</h3>
                  <p className="text-muted">Inicie sesión para continuar</p>
                </div>
                
                {(error || formError) && (
                  <Alert variant="danger" className="mb-4">
                    {error || formError}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FontAwesomeIcon icon={faUser} className="text-muted" />
                      </span>
                      <Form.Control 
                        type="email" 
                        placeholder="Ingrese su email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Contraseña</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FontAwesomeIcon icon={faLock} className="text-muted" />
                      </span>
                      <Form.Control 
                        type="password" 
                        placeholder="Ingrese su contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 py-2 mb-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Iniciando sesión...
                      </>
                    ) : 'Iniciar Sesión'}
                  </Button>
                </Form>
                
                <div className="mt-4 text-center">
                  <small className="text-muted">
                    Sistema de gestión de créditos © 2025
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default LoginPage;