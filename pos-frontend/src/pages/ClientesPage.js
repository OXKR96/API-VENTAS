import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  InputGroup, 
  Form, 
  Row, 
  Col,
  Pagination,
  Spinner,
  Badge,
  Modal,
  Alert
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faUserPlus, 
  faEdit, 
  faTrashAlt,
  faSort,
  faFilter,
  faEye,
  faIdCard
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { OfflineContext } from '../context/OfflineContext';
import { toast } from 'react-toastify';

const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('nombre');
  const [order, setOrder] = useState('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [clienteToView, setClienteToView] = useState(null);
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    fechaNacimiento: ''
  });
  
  const { userInfo } = useContext(AuthContext);
  const { isOnline } = useContext(OfflineContext);
  
  // Cargar clientes
  const fetchClientes = async () => {
    try {
      setLoading(true);
      
      if (!isOnline) {
        setError('No hay conexión a internet. Los datos no se pueden cargar.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/clientes', {
        params: { page, limit, search, sort, order }
      });
      
      const data = response.data;
      setClientes(data.clientes);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
      setError(null);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('Error al cargar los clientes: ' + (error.response?.data?.message || error.message));
      
      // Datos de fallback para desarrollo
      if (process.env.NODE_ENV === 'development') {
        const fallbackData = [
          { 
            _id: '1', 
            cedula: '1234567890',
            nombre: 'Juan',
            apellido: 'Pérez',
            telefono: '3001234567',
            email: 'juan@example.com',
            direccion: 'Calle 123 # 45-67',
            fechaNacimiento: new Date('1990-01-01'),
            fechaCreacion: new Date()
          },
          { 
            _id: '2', 
            cedula: '0987654321',
            nombre: 'María',
            apellido: 'González',
            telefono: '3109876543',
            email: 'maria@example.com',
            direccion: 'Av Principal # 10-20',
            fechaNacimiento: new Date('1985-05-15'),
            fechaCreacion: new Date()
          }
        ];
        setClientes(fallbackData);
        setTotal(fallbackData.length);
        setPages(1);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar al montar y cuando cambien los filtros
  useEffect(() => {
    fetchClientes();
  }, [page, limit, sort, order]);
  
  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Resetear a primera página
    fetchClientes();
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar ordenamiento
  const handleSort = (column) => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column);
      setOrder('asc');
    }
  };
  
  // Manejar paginación
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pages) {
      setPage(newPage);
    }
  };
  
  // Abrir modal para crear nuevo cliente
  const handleOpenCreateModal = () => {
    setEditingCliente(null);
    setFormData({
      cedula: '',
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      direccion: '',
      fechaNacimiento: ''
    });
    setShowForm(true);
  };
  
  // Abrir modal para editar cliente
  const handleOpenEditModal = (cliente) => {
    setEditingCliente(cliente);
    
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
    
    setShowForm(true);
  };
  
  // Manejar visualización
  const handleView = (cliente) => {
    setClienteToView(cliente);
    setShowViewModal(true);
  };
  
  // Confirmar eliminación
  const handleConfirmDelete = (cliente) => {
    setClienteToDelete(cliente);
    setShowDeleteModal(true);
  };
  
  // Validar el formulario
  const validateForm = () => {
    if (!formData.cedula || !formData.nombre || !formData.apellido || !formData.telefono || !formData.email) {
      toast.error('Por favor complete todos los campos obligatorios');
      return false;
    }
    
    if (!/^\d{7,12}$/.test(formData.cedula)) {
      toast.error('La cédula debe tener entre 7 y 12 dígitos');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('El email ingresado no es válido');
      return false;
    }
    
    return true;
  };
  
  // Guardar cliente (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (editingCliente) {
        // Actualizar cliente existente
        await axios.put(`/api/clientes/${editingCliente._id}`, formData);
        toast.success('Cliente actualizado correctamente');
      } else {
        // Crear nuevo cliente
        await axios.post('/api/clientes', formData);
        toast.success('Cliente creado correctamente');
      }
      
      // Cerrar modal y recargar datos
      setShowForm(false);
      fetchClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast.error(error.response?.data?.message || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar cliente
  const handleDelete = async () => {
    try {
      if (!isOnline) {
        throw new Error('No hay conexión a internet. No se puede eliminar el cliente.');
      }
      
      await axios.delete(`/api/clientes/${clienteToDelete._id}`);
      toast.success('Cliente eliminado correctamente');
      setShowDeleteModal(false);
      setClienteToDelete(null);
      fetchClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar el cliente');
    }
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
  
  // Renderizar paginación
  const renderPagination = () => {
    // Si hay pocas páginas, mostrar todas
    if (pages <= 5) {
      return Array.from({ length: pages }, (_, i) => (
        <Pagination.Item 
          key={i + 1} 
          active={i + 1 === page}
          onClick={() => handlePageChange(i + 1)}
        >
          {i + 1}
        </Pagination.Item>
      ));
    }
    
    // Si hay muchas páginas, mostrar un subconjunto
    const items = [];
    
    // Primera página
    items.push(
      <Pagination.Item 
        key={1} 
        active={1 === page}
        onClick={() => handlePageChange(1)}
      >
        1
      </Pagination.Item>
    );
    
    // Ellipsis si la página actual está lejos del inicio
    if (page > 3) {
      items.push(<Pagination.Ellipsis key="ellipsis1" />);
    }
    
    // Páginas alrededor de la actual
    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(pages - 1, page + 1);
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === page}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Ellipsis si la página actual está lejos del final
    if (page < pages - 2) {
      items.push(<Pagination.Ellipsis key="ellipsis2" />);
    }
    
    // Última página
    if (pages > 1) {
      items.push(
        <Pagination.Item 
          key={pages} 
          active={pages === page}
          onClick={() => handlePageChange(pages)}
        >
          {pages}
        </Pagination.Item>
      );
    }
    
    return items;
  };
  
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Clientes</h2>
        <Button 
          variant="primary" 
          onClick={handleOpenCreateModal}
        >
          <FontAwesomeIcon icon={faUserPlus} className="me-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={faSearch} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar por cédula, nombre, teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button type="submit" variant="primary">
                    Buscar
                  </Button>
                </InputGroup>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text>
                    <FontAwesomeIcon icon={faFilter} />
                  </InputGroup.Text>
                  <Form.Select 
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option value="10">10 por página</option>
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={3} className="text-end">
                <Badge bg="info" className="me-2">
                  Total: {total} clientes
                </Badge>
                {!isOnline && (
                  <Badge bg="warning">
                    Modo sin conexión
                  </Badge>
                )}
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Tabla de clientes */}
      <Card className="border-0 shadow-sm">
        {error && (
          <Alert variant="danger" className="m-3">
            {error}
          </Alert>
        )}
        
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th 
                  onClick={() => handleSort('cedula')}
                  style={{cursor: 'pointer'}}
                >
                  Cédula
                  {sort === 'cedula' && (
                    <FontAwesomeIcon 
                      icon={faSort} 
                      className="ms-1" 
                      size="sm"
                      flip={order === 'desc' ? 'vertical' : undefined}
                    />
                  )}
                </th>
                <th 
                  onClick={() => handleSort('nombre')}
                  style={{cursor: 'pointer'}}
                >
                  Nombre
                  {sort === 'nombre' && (
                    <FontAwesomeIcon 
                      icon={faSort} 
                      className="ms-1" 
                      size="sm"
                      flip={order === 'desc' ? 'vertical' : undefined}
                    />
                  )}
                </th>
                <th 
                  onClick={() => handleSort('apellido')}
                  style={{cursor: 'pointer'}}
                >
                  Apellido
                  {sort === 'apellido' && (
                    <FontAwesomeIcon 
                      icon={faSort} 
                      className="ms-1" 
                      size="sm"
                      flip={order === 'desc' ? 'vertical' : undefined}
                    />
                  )}
                </th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No hay clientes para mostrar
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente._id}>
                    <td>{cliente.cedula}</td>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.email}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1"
                        onClick={() => handleView(cliente)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleOpenEditModal(cliente)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleConfirmDelete(cliente)}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
        
        {/* Paginación */}
        {!loading && pages > 1 && (
          <Card.Footer className="bg-white border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                Mostrando página {page} de {pages}
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                />
                {renderPagination()}
                <Pagination.Next
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                />
              </Pagination>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Modal de Formulario */}
      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faIdCard} className="me-2" />
            {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cédula</Form.Label>
                  <Form.Control
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    required
                    disabled={editingCliente} // No permitir cambiar cédula al editar
                  />
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
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
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
                    onChange={handleChange}
                    required
                  />
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
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
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

      {/* Modal de Eliminar */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {clienteToDelete && (
            <p>
              ¿Está seguro que desea eliminar al cliente <strong>{clienteToDelete.nombre} {clienteToDelete.apellido}</strong> con cédula <strong>{clienteToDelete.cedula}</strong>?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Ver Cliente */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faIdCard} className="me-2" />
            Detalles del Cliente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {clienteToView && (
            <Card className="border-0">
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted">Información Personal</h6>
                    <hr />
                    <p><strong>Cédula:</strong> {clienteToView.cedula}</p>
                    <p><strong>Nombre Completo:</strong> {clienteToView.nombre} {clienteToView.apellido}</p>
                    <p><strong>Fecha de Nacimiento:</strong> {formatDate(clienteToView.fechaNacimiento)}</p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted">Información de Contacto</h6>
                    <hr />
                    <p><strong>Teléfono:</strong> {clienteToView.telefono}</p>
                    <p><strong>Email:</strong> {clienteToView.email}</p>
                    <p><strong>Dirección:</strong> {clienteToView.direccion || 'No registrada'}</p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <h6 className="text-muted">Información Adicional</h6>
                    <hr />
                    <p><strong>Fecha de Registro:</strong> {formatDate(clienteToView.fechaCreacion)}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowViewModal(false);
              handleOpenEditModal(clienteToView);
            }}
          >
            Editar
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default ClientesPage;