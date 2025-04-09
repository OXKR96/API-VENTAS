import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../../utils/axiosConfig';

const ClienteForm = ({ cliente, onClose, isOnline }) => {
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    fechaNacimiento: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Si hay un cliente para editar, cargar sus datos
  useEffect(() => {
    if (cliente) {
      // Formatear la fecha de nacimiento para el input date si existe
      const fechaNacimiento = cliente.fechaNacimiento 
        ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0] 
        : '';
      
      setFormData({
        cedula: cliente.cedula || '',
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        fechaNacimiento: fechaNacimiento
      });
    }
  }, [cliente]);
  
  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico cuando el usuario corrige
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validar el formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cedula) newErrors.cedula = 'Cédula es requerida';
    else if (!/^\d{7,12}$/.test(formData.cedula)) newErrors.cedula = 'Cédula debe tener entre 7 y 12 dígitos';
    
    if (!formData.nombre) newErrors.nombre = 'Nombre es requerido';
    if (!formData.apellido) newErrors.apellido = 'Apellido es requerido';
    
    if (!formData.telefono) newErrors.telefono = 'Teléfono es requerido';
    else if (!/^\d{7,15}$/.test(formData.telefono)) newErrors.telefono = 'Teléfono inválido';
    
    if (!formData.email) newErrors.email = 'Email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    
    return newErrors;
  };
  
  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!isOnline) {
        throw new Error('No hay conexión a internet. Por favor intente más tarde.');
      }
      
      // Crear o actualizar cliente
      if (cliente) {
        // Actualizar cliente existente
        await api.put(`/clientes/${cliente._id}`, formData);
      } else {
        // Crear nuevo cliente
        await api.post('/clientes', formData);
      }
      
      setSuccess(true);
      
      // Después de 1.5 segundos, cerrar el modal
      setTimeout(() => {
        onClose(true); // true indica que se debe refrescar la lista
      }, 1500);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Error al guardar el cliente. Por favor intente nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Cliente guardado exitosamente</Alert>}
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cédula</Form.Label>
            <Form.Control
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleChange}
              isInvalid={!!errors.cedula}
              disabled={loading || (cliente && cliente.cedula)}
            />
            <Form.Control.Feedback type="invalid">
              {errors.cedula}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Fecha de Nacimiento</Form.Label>
            <Form.Control
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              isInvalid={!!errors.fechaNacimiento}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.fechaNacimiento}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              isInvalid={!!errors.nombre}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.nombre}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Apellido</Form.Label>
            <Form.Control
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              isInvalid={!!errors.apellido}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.apellido}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              isInvalid={!!errors.telefono}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.telefono}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group className="mb-3">
        <Form.Label>Dirección</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          isInvalid={!!errors.direccion}
          disabled={loading}
        />
        <Form.Control.Feedback type="invalid">
          {errors.direccion}
        </Form.Control.Feedback>
      </Form.Group>
      
      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button 
          variant="secondary" 
          onClick={() => onClose()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Guardando...
            </>
          ) : cliente ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </Form>
  );
};

export default ClienteForm;