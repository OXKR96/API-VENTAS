import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { Badge, Button, Table } from 'react-bootstrap';

export function Sales() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saleType, setSaleType] = useState('Contado');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [editingSale, setEditingSale] = useState(null);
  const [saleData, setSaleData] = useState({
    paymentMethod: 'Efectivo',
    saleType: 'Contado',
    notes: '',
    items: []
  });
  const [filters, setFilters] = useState({
    search: '',
    dateRange: {
      start: '',
      end: ''
    },
    saleType: '',
    status: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [allSales, setAllSales] = useState([]); // Estado para todas las ventas sin filtrar
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadSales();
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api.getCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  // Efecto para filtrar productos cuando cambia el término de búsqueda
  useEffect(() => {
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product._id.toString().includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      const productsWithStock = data.data.filter(p => p.stock > 0);
      setProducts(productsWithStock);
      setFilteredProducts(productsWithStock);
      setError('');
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error al cargar productos: ' + error.message);
    }
  };

  // Efecto para cargar ventas cuando cambien los filtros
  useEffect(() => {
    loadSales();
  }, [filters]);

  const loadSales = async () => {
    try {
      const response = await api.getSales(filters);
      console.log('Respuesta completa de ventas:', response);
      
      if (!response.success) {
        console.error('Error en la respuesta del API');
        return;
      }
      
      let salesArray = response.data || [];
      console.log('Número total de ventas recibidas:', salesArray.length);
      
      // Procesar las ventas
      const processedSales = salesArray.map((sale, index) => ({
        ...sale,
        displayNumber: salesArray.length - index,
        saleType: sale.saleType || 'Contado',
        status: sale.status || 'Completada',
        totalAmount: parseFloat(sale.totalAmount) || 0,
        items: Array.isArray(sale.items) ? sale.items : [],
        createdAt: sale.createdAt || sale.date || new Date().toISOString()
      }));
      
      console.log('Ventas procesadas:', processedSales.length);
      
      setAllSales(processedSales);
      setSales(processedSales);
      
      if (processedSales.length === 0) {
        toast.info('No se encontraron ventas con los filtros aplicados');
      }
      
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      toast.error('Error al cargar el historial de ventas');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      dateRange: { start: '', end: '' },
      saleType: '',
      status: ''
    });
  };

  const handleAddToCart = (product) => {
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setError('Este producto ya está en el carrito. Modifica su cantidad si deseas más unidades.');
      return;
    }

    // Verificar stock disponible
    if (product.stock <= 0) {
      setError('No hay stock disponible para este producto');
      return;
    }

    setCart([...cart, { ...product, quantity: 1 }]);
    setError('');
  };

  const updateCartItemQuantity = (index, newQuantity) => {
    // Validar que la cantidad sea un número válido
    if (isNaN(newQuantity) || newQuantity <= 0) {
      toast.error('La cantidad debe ser un número mayor a 0');
      return;
    }

    const product = products.find(p => p._id === cart[index]._id);
    if (!product) {
      toast.error('Error: Producto no encontrado');
      return;
    }

    if (newQuantity > product.stock) {
      toast.warning(`Solo hay ${product.stock} unidades disponibles de ${product.name}`);
      return;
    }

    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
    toast.success(`Cantidad actualizada a ${newQuantity}`);
    setError('');
  };

  const handleCancelSale = async (saleId) => {
    try {
      if (!window.confirm('¿Está seguro de que desea cancelar esta venta? Esta acción revertirá el stock de los productos.')) {
        return;
      }

      setIsLoading(true);
      const response = await api.put(`/sales/${saleId}/cancel`);
      
      if (response.data.success) {
        toast.success('Venta cancelada exitosamente');
        loadSales(); // Recargar la lista de ventas
      } else {
        toast.error(response.data.message || 'Error al cancelar la venta');
      }
    } catch (error) {
      console.error('Error al cancelar la venta:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la venta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaleTypeChange = (type) => {
    if (type === 'Crédito' && !selectedCustomer) {
      toast.error('Debe seleccionar un cliente para ventas a crédito');
      return;
    }
    setSaleType(type);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleCompleteSale = async () => {
    try {
      if (!cart.length) {
        toast.error('Agregue al menos un producto a la venta');
        return;
      }

      if (saleType === 'Crédito' && !selectedCustomer) {
        toast.error('Debe seleccionar un cliente para ventas a crédito');
        return;
      }

      const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

      const salePayload = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          subtotal: item.quantity * item.price
        })),
        totalAmount: totalAmount,
        saleType: saleType,
        paymentMethod: paymentMethod,
        customerId: selectedCustomer?._id || null,
        date: new Date().toISOString(),
        status: 'Completada',
        notes: saleData.notes
      };

      console.log('Enviando venta:', salePayload);
      const response = await api.createSale(salePayload);
      
      if (response.success) {
        toast.success('Venta registrada exitosamente');
        resetSale();
        loadProducts();
        loadSales();
      } else {
        toast.error(response.message || 'Error al procesar la venta');
      }
    } catch (error) {
      console.error('Error al completar la venta:', error);
      toast.error(error.response?.data?.message || 'Error al procesar la venta');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    setSelectedCustomer(customer || null);
  };

  const resetSale = () => {
    setCart([]);
    setShowModal(false);
    setError('');
    setSelectedCustomer(null);
    setSaleType('Contado');
    setPaymentMethod('Efectivo');
    setEditingSale(null);
    setSaleData({
      paymentMethod: 'Efectivo',
      saleType: 'Contado',
      notes: '',
      items: []
    });
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const handleViewSaleDetail = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  return (
    <div className="container-fluid mt-4">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="d-flex justify-content-between mb-4">
        <h2>Ventas</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Filtros de ventas */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Buscar</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por cliente o número..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Tipo de Venta</label>
              <select
                className="form-select"
                value={filters.saleType}
                onChange={(e) => handleFilterChange('saleType', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleClearFilters}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Método de Pago</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{sale.displayNumber}</td>
                    <td>{sale.customer?.name || 'Cliente General'}</td>
                    <td>
                      <Badge bg={sale.saleType === 'Crédito' ? 'info' : 'success'}>
                        {sale.saleType}
                      </Badge>
                    </td>
                    <td>{sale.paymentMethod}</td>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>${sale.totalAmount.toLocaleString()}</td>
                    <td>
                      <Badge bg={sale.status === 'Completada' ? 'success' : 
                               sale.status === 'Cancelada' ? 'danger' : 'warning'}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="btn-group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewSaleDetail(sale)}
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        {sale.status !== 'Cancelada' && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="ms-1"
                            onClick={() => handleCancelSale(sale._id)}
                            disabled={isLoading}
                            title="Cancelar venta"
                          >
                            <i className="fas fa-ban"></i>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {sales.length === 0 && (
              <div className="text-center p-3">
                <p>No hay ventas que coincidan con los filtros</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingSale ? 'Editar Venta' : 'Nueva Venta'}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    setSearchTerm('');
                    setSelectedCustomer(null);
                    setPaymentMethod('Efectivo');
                    setEditingSale(null);
                    setCart([]);
                    resetSale();
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Selección de cliente */}
                <div className="mb-3">
                  <label className="form-label">Cliente</label>
                  <select
                    className="form-select"
                    value={selectedCustomer?._id || ''}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    required={saleType === 'Crédito'}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.document}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Venta */}
                <div className="mb-3">
                  <label className="form-label">Tipo de Venta</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn ${saleType === 'Contado' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleSaleTypeChange('Contado')}
                    >
                      Contado
                    </button>
                    <button
                      type="button"
                      className={`btn ${saleType === 'Crédito' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleSaleTypeChange('Crédito')}
                    >
                      Crédito
                    </button>
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="mb-3">
                  <label className="form-label">Método de Pago</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    disabled={saleType === 'Crédito'}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                {/* Observaciones */}
                <div className="mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={saleData.notes}
                    onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                    rows="3"
                    placeholder="Agregar observaciones sobre la venta..."
                  ></textarea>
                </div>

                {/* Selector de productos */}
                <div className="mb-3">
                  <label className="form-label d-flex justify-content-between align-items-center">
                    <span>Productos</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowProductSearch(!showProductSearch)}
                    >
                      <i className="fas fa-search"></i> Buscar Producto
                    </button>
                  </label>

                  {showProductSearch && (
                    <>
                      <div className="input-group mb-3">
                        <span className="input-group-text">
                          <i className="fas fa-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Buscar producto por nombre o código..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map(product => (
                            <button
                              key={product._id}
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => {
                                handleAddToCart(product);
                                setSearchTerm('');
                              }}
                            >
                              <div>
                                <strong>{product.name}</strong>
                                <br />
                                <small className="text-muted">Código: {product._id}</small>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold">${product.price}</div>
                                <span className={`badge ${product.stock > 10 ? 'bg-success' : 'bg-warning'}`}>
                                  Stock: {product.stock}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="list-group-item text-center text-muted">
                            No se encontraron productos
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Tabla del carrito */}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Stock Disp.</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td style={{ width: '120px' }}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                // Si el campo está vacío, no actualizamos la cantidad
                                return;
                              }
                              updateCartItemQuantity(index, parseInt(value));
                            }}
                            onBlur={(e) => {
                              // Si el campo está vacío al perder el foco, restauramos a 1
                              if (e.target.value === '') {
                                updateCartItemQuantity(index, 1);
                              }
                            }}
                            min="1"
                            max={products.find(p => p._id === item._id)?.stock}
                            required
                          />
                        </td>
                        <td>
                          <span className={`badge ${item.stock > 10 ? 'bg-success' : 'bg-warning'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td>${item.price}</td>
                        <td>${item.price * item.quantity}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              const newCart = cart.filter((_, i) => i !== index);
                              setCart(newCart);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="text-end"><strong>Total:</strong></td>
                      <td colSpan="2">
                        <strong>
                          ${calculateTotal()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <button 
                  className="btn btn-primary w-100"
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || !selectedCustomer}
                >
                  {editingSale ? 'Actualizar Venta' : 'Completar Venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Venta */}
      {showDetailModal && selectedSale && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles de la Venta</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSale(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Fecha:</strong> {formatDate(selectedSale.createdAt)}
                </div>
                <div className="mb-3">
                  <strong>Cliente:</strong> {selectedSale.customer?.name || 'Cliente General'}
                </div>
                <div className="mb-3">
                  <strong>Tipo de Venta:</strong> {selectedSale.saleType}
                </div>
                <div className="mb-3">
                  <strong>Método de Pago:</strong> {selectedSale.paymentMethod}
                </div>
                <div className="mb-3">
                  <strong>Estado:</strong>
                  <span className={`badge ms-2 ${selectedSale.status === 'Completada' ? 'bg-success' : 'bg-warning'}`}>
                    {selectedSale.status}
                  </span>
                </div>
                <div className="mb-3">
                  <strong>Productos:</strong>
                  <ul className="list-group mt-2">
                    {selectedSale.items.map((item, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          {item.quantity}x {item.name}
                          <small className="d-block text-muted">Precio unitario: ${item.price}</small>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          ${item.subtotal}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedSale.notes && (
                  <div className="mb-3">
                    <strong>Observaciones:</strong>
                    <p className="mt-1">{selectedSale.notes}</p>
                  </div>
                )}
                <div className="text-end">
                  <strong>Total:</strong> ${selectedSale.totalAmount}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedSale(null);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;