// src/pages/UsuariosPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faEdit,
  faTrash,
  faLock,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const UsuariosPage = () => {
  // Estados para manejar usuarios y formularios
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    documento: '',
    nombre: '',
    apellido: '',
    cargo: '',
    tipo: 'Comercial',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
    estado: 'Activo'
  });
  const [filtro, setFiltro] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Acceder al contexto de autenticación
  const { userInfo } = useContext(AuthContext);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Función para obtener usuarios
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('No se pudieron cargar los usuarios. Por favor, intente nuevamente.');
      
      // Datos de fallback para desarrollo
      if (process.env.NODE_ENV === 'development') {
        const fallbackData = [
          { 
            _id: '1', 
            documento: '123456789', 
            nombre: 'Juan', 
            apellido: 'Pérez',
            cargo: 'Asesor Comercial',
            tipo: 'Comercial',
            telefono: '3151234567',
            email: 'juan@creditos.com',
            estado: 'Activo',
            fechaCreacion: new Date()
          },
          { 
            _id: '2', 
            documento: '987654321', 
            nombre: 'Ana', 
            apellido: 'Gómez',
            cargo: 'Gerente',
            tipo: 'Administrativo',
            telefono: '3209876543',
            email: 'ana@creditos.com',
            estado: 'Activo',
            fechaCreacion: new Date()
          },
          { 
            _id: '3', 
            documento: '555666777', 
            nombre: 'Carlos', 
            apellido: 'Rodríguez',
            cargo: 'Director',
            tipo: 'Super Usuario',
            telefono: '3001112233',
            email: 'carlos@creditos.com',
            estado: 'Inactivo',
            fechaCreacion: new Date()
          }
        ];
        setUsuarios(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };
  
  

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Abrir modal para crear nuevo usuario
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData({
      documento: '',
      nombre: '',
      apellido: '',
      cargo: '',
      tipo: 'Comercial',
      telefono: '',
      email: '',
      password: '',
      confirmPassword: '',
      estado: 'Activo'
    });
    setShowModal(true);
  };

  // Abrir modal para editar usuario
  const handleOpenEditModal = (usuario) => {
    setIsEditing(true);
    setUsuarioSeleccionado(usuario);
    setFormData({
      documento: usuario.documento,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      cargo: usuario.cargo,
      tipo: usuario.tipo,
      telefono: usuario.telefono || '',
      email: usuario.email,
      password: '',
      confirmPassword: '',
      estado: usuario.estado
    });
    setShowModal(true);
  };

  // Abrir modal para eliminar usuario
  const handleOpenDeleteModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowDeleteModal(true);
  };

  // Abrir modal para restablecer contraseña
  const handleOpenResetPasswordModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
    setShowResetPasswordModal(true);
  };

  // Validación de formulario
  const validateForm = () => {
    if (!formData.documento || !formData.nombre || !formData.apellido || !formData.email) {
      toast.error('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (!isEditing && formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }


    return true;
  };

  // Guardar usuario (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Crear copia para no modificar estado original
      const dataToSend = { ...formData };
      
      if (isEditing) {
        // Actualizar usuario existente
        await axios.put(`/api/usuarios/${usuarioSeleccionado._id}`, dataToSend);
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        await axios.post('/api/usuarios', dataToSend);
        toast.success('Usuario creado correctamente');
      }
      
      // Cerrar modal y recargar datos
      setShowModal(false);
      fetchUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUsuario = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/usuarios/${usuarioSeleccionado._id}`);
      toast.success('Usuario eliminado correctamente');
      setShowDeleteModal(false);
      fetchUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar el usuario');
    } finally {
      setLoading(false);
    }
  };

  // Restablecer contraseña
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    try {
      await axios.put(`/api/usuarios/${usuarioSeleccionado._id}/reset-password`, {
        password: formData.password
      });
      
      toast.success('Contraseña restablecida correctamente');
      setShowResetPasswordModal(false);
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      toast.error(error.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos para editar usuarios
  const canEditUsuario = (usuario) => {
    // Super Usuario puede editar a cualquiera
    if (userInfo?.tipo === 'Super Usuario') {
      return true;
    }
    
    // Administrativo puede editar solo a comerciales
    if (userInfo?.tipo === 'Administrativo') {
      return usuario.tipo === 'Comercial';
    }
    
    // Comercial no puede editar usuarios
    return false;
  };

  // Verificar permisos para cambiar contraseña
  const canResetPassword = (usuario) => {
    // Super Usuario puede cambiar la contraseña de cualquiera
    if (userInfo?.tipo === 'Super Usuario') {
      return true;
    }
    
    // Administrativo puede cambiar contraseña solo de comerciales
    if (userInfo?.tipo === 'Administrativo') {
      return usuario.tipo === 'Comercial';
    }
    
    // Comercial no puede cambiar contraseñas
    return false;
  };

  // Verificar permisos para eliminar usuarios
  const canDeleteUsuario = (usuario) => {
    // Verificar si el usuario es Super Usuario
    if (usuario.tipo === 'Super Usuario') {
      // Solo otro Super Usuario puede eliminar a un Super Usuario
      // Y nadie puede eliminarse a sí mismo
      return userInfo?.tipo === 'Super Usuario' && userInfo._id !== usuario._id;
    }
    
    // Super Usuario puede eliminar a cualquiera excepto a sí mismo
    if (userInfo?.tipo === 'Super Usuario') {
      return userInfo._id !== usuario._id;
    }
    
    // Administrativo puede eliminar solo a comerciales
    if (userInfo?.tipo === 'Administrativo') {
      return usuario.tipo === 'Comercial';
    }
    
    // Comercial no puede eliminar usuarios
    return false;
  };

  // Verificar permisos para crear usuarios
  const canCreateUsuario = () => {
    return userInfo?.tipo === 'Super Usuario' || userInfo?.tipo === 'Administrativo';
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.apellido.toLowerCase().includes(filtro.toLowerCase()) ||
    usuario.documento.includes(filtro) ||
    usuario.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Usuarios</h2>
        {canCreateUsuario() && (
          <Button 
            variant="primary" 
            onClick={handleOpenCreateModal}
          >
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Nuevo Usuario
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
                placeholder="Buscar usuario..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            <div>
              <small className="text-muted">
                Total: {usuariosFiltrados.length} usuarios
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
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Tipo</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map(usuario => (
                      <tr key={usuario._id}>
                        <td>{usuario.documento}</td>
                        <td>{usuario.nombre} {usuario.apellido}</td>
                        <td>{usuario.cargo}</td>
                        <td>
                          <Badge bg={
                            usuario.tipo === 'Super Usuario' ? 'danger' :
                            usuario.tipo === 'Administrativo' ? 'primary' : 'success'
                          }>
                            {usuario.tipo}
                          </Badge>
                        </td>
                        <td>{usuario.email}</td>
                        <td>
                          <Badge bg={usuario.estado === 'Activo' ? 'success' : 'secondary'}>
                            {usuario.estado}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleOpenEditModal(usuario)}
                              disabled={!canEditUsuario(usuario)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              onClick={() => handleOpenResetPasswordModal(usuario)}
                              disabled={!canResetPassword(usuario)}
                            >
                              <FontAwesomeIcon icon={faLock} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleOpenDeleteModal(usuario)}
                              disabled={!canDeleteUsuario(usuario)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-3">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento</Form.Label>
                  <Form.Control
                    type="text"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    required
                    readOnly={isEditing} // No permitir cambiar documento al editar
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
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
                    required
                  />
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
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cargo</Form.Label>
                  <Form.Control
                    type="text"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Usuario</Form.Label>
                  <Form.Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                    disabled={
                      // Super Usuario no puede ser editado excepto por otro Super Usuario
                      isEditing && 
                      formData.tipo === 'Super Usuario' && 
                      userInfo?.tipo !== 'Super Usuario'
                    }
                  >
                    <option value="Comercial">Comercial</option>
                    {(userInfo?.tipo === 'Super Usuario' || userInfo?.tipo === 'Administrativo') && (
                      <option value="Administrativo">Administrativo</option>
                    )}
                    {userInfo?.tipo === 'Super Usuario' && (
                      <option value="Super Usuario">Super Usuario</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {!isEditing && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirmar Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isEditing}
                    />
                  </Form.Group>
                </Col>
              </Row>
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
            <Button variant="primary" type="submit" disabled={loading}>
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

      {/* Modal para eliminar usuario */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Está seguro que desea eliminar el usuario <strong>{usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellido}</strong>?</p>
          <p className="text-danger"><strong>Advertencia:</strong> Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUsuario} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para restablecer contraseña */}
      <Modal show={showResetPasswordModal} onHide={() => setShowResetPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Restablecer Contraseña</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResetPassword}>
          <Modal.Body>
          <p>Restablecer contraseña para el usuario: <strong>{usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellido}</strong></p>
          
          <Form.Group className="mb-3">
            <Form.Label>Nueva Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Confirmar Contraseña</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
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

export default UsuariosPage;