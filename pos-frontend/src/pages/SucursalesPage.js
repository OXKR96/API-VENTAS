// src/pages/SucursalesPage.js
import React, { useState, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Table, Button, Modal, Form, Row, Col, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import {
  faBuilding,
  faEdit,
  faPlus,
  faSearch,
  faUserTie
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const SucursalesPage = () => {
  // Estados para manejar sucursales y formularios
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombreComercial: '',
    direccion: '',
    responsable: '',
    estado: 'Activo',
    saldoDisponible: 0
  });
  const [filtro, setFiltro] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Acceder al contexto de autenticación
  const { userInfo } = useContext(AuthContext);

  // Cargar sucursales y usuarios al montar el componente
  useEffect(() => {
    fetchSucursales();
    fetchUsuarios();
  }, []);

  // Función para obtener sucursales
  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sucursales');
      setSucursales(response.data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      setError('No se pudieron cargar las sucursales. Por favor, intente nuevamente.');
      
      // Datos de fallback para desarrollo
      if (process.env.NODE_ENV === 'development') {
        const fallbackData = [
          { 
            _id: '1', 
            nombreComercial: 'Sucursal Principal',
            direccion: 'Calle Principal #123',
            responsable: { 
              _id: '1', 
              nombre: 'Juan', 
              apellido: 'Pérez',
              documento: '123456789'
            },
            estado: 'Activo',
            saldoDisponible: 5000000,
            fechaCreacion: new Date()
          },
          { 
            _id: '2', 
            nombreComercial: 'Sucursal Norte',
            direccion: 'Av. Norte #456',
            responsable: { 
              _id: '2', 
              nombre: 'Ana', 
              apellido: 'Gómez',
              documento: '987654321'
            },
            estado: 'Activo',
            saldoDisponible: 3500000,
            fechaCreacion: new Date()
          }
        ];
        setSucursales(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Función para obtener usuarios
  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('/api/usuarios');
      // Filtrar solo usuarios comerciales para asignar como responsables
      const usuariosComerciales = response.data.filter(
        usuario => usuario.tipo === 'Comercial' && usuario.estado === 'Activo'
      );
      setUsuarios(usuariosComerciales);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      // Código de fallback...
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Abrir modal para crear nueva sucursal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData({
      nombreComercial: '',
      direccion: '',
      responsable: '',
      estado: 'Activo',
      saldoDisponible: 0
    });
    setShowModal(true);
  };

  // Abrir modal para editar sucursal
  const handleOpenEditModal = (sucursal) => {
    setIsEditing(true);
    setSucursalSeleccionada(sucursal);
    setFormData({
      nombreComercial: sucursal.nombreComercial,
      direccion: sucursal.direccion,
      responsable: sucursal.responsable?._id || '',
      estado: sucursal.estado,
      saldoDisponible: sucursal.saldoDisponible
    });
    setShowModal(true);
  };

  // Validación de formulario
  const validateForm = () => {
    if (!formData.nombreComercial || !formData.direccion || !formData.responsable) {
      toast.error('Por favor complete todos los campos obligatorios');
      return false;
    }
    return true;
  };

  // Guardar sucursal (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isEditing) {
        // Actualizar sucursal existente
        await axios.put(`/api/sucursales/${sucursalSeleccionada._id}`, formData);
        toast.success('Sucursal actualizada correctamente');
      } else {
        // Crear nueva sucursal
        await axios.post('/api/sucursales', formData);
        toast.success('Sucursal creada correctamente');
      }
      
      // Cerrar modal y recargar datos
      setShowModal(false);
      fetchSucursales();
      fetchUsuarios(); // Recargar usuarios por si cambió la asignación de sucursales
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
      toast.error(error.response?.data?.message || 'Error al guardar la sucursal');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos para crear/editar sucursales
  const canManageSucursal = () => {
    return userInfo?.tipo === 'Super Usuario' || userInfo?.tipo === 'Administrativo';
  };

  // Filtrar sucursales
  const sucursalesFiltradas = sucursales.filter(sucursal =>
    sucursal.nombreComercial.toLowerCase().includes(filtro.toLowerCase()) ||
    sucursal.direccion.toLowerCase().includes(filtro.toLowerCase()) ||
    (sucursal.responsable?.nombre && 
      `${sucursal.responsable.nombre} ${sucursal.responsable.apellido}`
        .toLowerCase()
        .includes(filtro.toLowerCase())
    )
  );

  // Encontrar usuario disponible (no asignado a otra sucursal)
  const usuariosDisponibles = () => {
    // Ya no filtramos por sucursal asignada, solo devolvemos todos los usuarios comerciales
    return usuarios;
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Sucursales</h2>
        {canManageSucursal() && (
          <Button 
            variant="primary" 
            onClick={handleOpenCreateModal}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Nueva Sucursal
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <Form.Control
                type="text"
                placeholder="Buscar sucursal..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            <div>
              <small className="text-muted">
                Total: {sucursalesFiltradas.length} sucursales
              </small>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nombre Comercial</th>
                    <th>Dirección</th>
                    <th>Responsable</th>
                    <th>Saldo Disponible</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sucursalesFiltradas.length > 0 ? (
                    sucursalesFiltradas.map(sucursal => (
                      <tr key={sucursal._id}>
                        <td>{sucursal.nombreComercial}</td>
                        <td>{sucursal.direccion}</td>
                        <td>
                          {sucursal.responsable ? (
                            <div className="d-flex align-items-center">
                              <FontAwesomeIcon icon={faUserTie} className="me-2 text-primary" />
                              {`${sucursal.responsable.nombre} ${sucursal.responsable.apellido}`}
                              <small className="ms-2 text-muted">
                                ({sucursal.responsable.documento})
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">Sin asignar</span>
                          )}
                        </td>
                        <td className="text-end">
                          $ {sucursal.saldoDisponible?.toLocaleString() || 0}
                        </td>
                        <td>
                          <Badge bg={sucursal.estado === 'Activo' ? 'success' : 'secondary'}>
                            {sucursal.estado}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleOpenEditModal(sucursal)}
                              disabled={!canManageSucursal()}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        No se encontraron sucursales
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar sucursal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faBuilding} className="me-2" />
            {isEditing ? 'Editar Sucursal' : 'Crear Nueva Sucursal'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Comercial</Form.Label>
              <Form.Control
                type="text"
                name="nombreComercial"
                value={formData.nombreComercial}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Responsable</Form.Label>
              <Form.Select
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar responsable</option>
                {usuariosDisponibles().map(usuario => (
                  <option key={usuario._id} value={usuario._id}>
                    {`${usuario.nombre} ${usuario.apellido} (${usuario.documento})`}
                  </option>
                ))}
              </Form.Select>
              {usuariosDisponibles().length === 0 && (
                <Form.Text className="text-danger">
                  No hay usuarios comerciales disponibles. Por favor, cree un usuario comercial primero.
                </Form.Text>
              )}
            </Form.Group>
            
            {isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Saldo Disponible</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="saldoDisponible"
                    value={formData.saldoDisponible}
                    onChange={handleChange}
                  />
                </InputGroup>
              </Form.Group>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading || usuariosDisponibles().length === 0}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default SucursalesPage;