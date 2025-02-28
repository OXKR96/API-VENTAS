import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Container, Row, Col, Form, Badge, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { api } from '../services/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const paymentTermsOptions = [
    { value: 'Contado', label: 'Contado' },
    { value: '7 días', label: '7 días' },
    { value: '15 días', label: '15 días' },
    { value: '21 días', label: '21 días' },
    { value: '30 días', label: '30 días' },
    { value: '45 días', label: '45 días' },
    { value: '60 días', label: '60 días' },
    { value: '90 días', label: '90 días' },
    { value: 'Fin de mes', label: 'Fin de mes' },
    { value: 'Contra entrega', label: 'Contra entrega' },
    { value: 'Pago anticipado', label: 'Pago anticipado' }
  ];

  const initialFormData = {
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 'Contado' // Valor por defecto
  };

  const [formData, setFormData] = useState(initialFormData);

  // Debounce para la búsqueda
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const loadSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/suppliers?search=${search}&isActive=${!showInactive}`);
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      toast.error('Error al cargar los proveedores');
    } finally {
      setIsLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    const debouncedLoad = debounce(() => {
      loadSuppliers();
    }, 300);
    debouncedLoad();
    return () => debouncedLoad.cancel?.();
  }, [loadSuppliers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (currentSupplier) {
        await api.put(`/suppliers/${currentSupplier._id}`, formData);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Proveedor creado exitosamente');
      }
      setShowModal(false);
      setFormData(initialFormData);
      loadSuppliers();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al procesar la operación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      taxId: supplier.taxId,
      paymentTerms: supplier.paymentTerms
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (supplier) => {
    try {
      setIsLoading(true);
      const newStatus = !supplier.isActive;
      const response = await api.put(`/suppliers/${supplier._id}/toggle-status`, {
        isActive: newStatus
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        loadSuppliers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar el estado del proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <h2>Proveedores</h2>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => {
              setCurrentSupplier(null);
              setFormData(initialFormData);
              setShowModal(true);
            }}
            disabled={isLoading}
          >
            Nuevo Proveedor
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
          />
        </Col>
        <Col md={4}>
          <Form.Check
            type="switch"
            id="show-inactive"
            label="Mostrar proveedores inactivos"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            disabled={isLoading}
          />
        </Col>
      </Row>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>CC/NIT</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier._id}>
              <td>{supplier.name}</td>
              <td>{supplier.contactName}</td>
              <td>{supplier.email}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.taxId}</td>
              <td>
                <Badge bg={supplier.isActive ? 'success' : 'danger'}>
                  {supplier.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleEdit(supplier)}
                  disabled={isLoading}
                >
                  Editar
                </Button>
                <Button
                  variant={supplier.isActive ? "danger" : "success"}
                  size="sm"
                  onClick={() => handleToggleStatus(supplier)}
                  disabled={isLoading}
                >
                  {supplier.isActive ? 'Desactivar' : 'Activar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{currentSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CC/NIT</Form.Label>
                  <Form.Control
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Contacto</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Términos de Pago</Form.Label>
                  <Form.Select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    required
                  >
                    {paymentTermsOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Suppliers;