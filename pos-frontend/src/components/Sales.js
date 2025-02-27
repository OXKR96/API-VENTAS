import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

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
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [editingSale, setEditingSale] = useState(null);

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

  const loadSales = async () => {
    try {
      const response = await api.getSales();
      setSales(response.data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError('Error al cargar el historial de ventas');
    }
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
    if (!window.confirm('¿Está seguro de cancelar esta venta?\n\nRecuerde que:\n- El stock de los productos será devuelto al inventario\n- Esta operación no se puede deshacer')) {
      return;
    }

    try {
      const response = await api.cancelSale(saleId);
      if (response.success) {
        toast.success(response.message || 'Venta cancelada exitosamente');
        loadProducts(); // Recargamos los productos para actualizar el stock
        loadSales(); // Recargamos las ventas
      } else {
        toast.error(response.message || 'Error al cancelar la venta');
      }
    } catch (error) {
      console.error('Error al cancelar la venta:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la venta');
    }
  };

  const handleCreateSale = async () => {
    try {
      if (!selectedCustomer) {
        setError('Por favor seleccione un cliente');
        return;
      }

      // Verificar stock antes de crear la venta
      for (const item of cart) {
        const product = products.find(p => p._id === item._id);
        if (!product || product.stock < item.quantity) {
          setError(`Stock insuficiente para ${item.name}`);
          return;
        }
      }

      const sale = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          subtotal: item.price * item.quantity
        })),
        paymentMethod,
        customer: selectedCustomer,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'Completada',
        notes: '',
        discount: 0,
        taxes: 19
      };
      
      if (editingSale) {
        await api.updateSale(editingSale._id, sale);
        toast.success('Venta actualizada exitosamente');
      } else {
        await api.createSale(sale);
        toast.success('Venta registrada exitosamente');
      }
      
      setCart([]);
      setShowModal(false);
      setError('');
      setSelectedCustomer(null);
      setPaymentMethod('Efectivo');
      setEditingSale(null);
      loadProducts();
      loadSales();
    } catch (error) {
      console.error('Error detallado:', error.response?.data || error);
      setError('Error al procesar la venta: ' + (error.response?.data?.message || error.message));
    }
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

  return (
    <div className="container mt-4">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <div className="d-flex justify-content-between mb-4">
        <h2>Ventas</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nueva Venta
        </button>
      </div>

      {/* Tabla de historial de ventas */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Método de Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id}>
                <td>{formatDate(sale.createdAt)}</td>
                <td>{sale.customer?.name || 'Cliente General'}</td>
                <td>
                  <ul className="list-unstyled mb-0">
                    {sale.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - ${item.price}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>${sale.totalAmount}</td>
                <td>{sale.paymentMethod}</td>
                <td>
                  <span className={`badge ${sale.status === 'Completada' ? 'bg-success' : 'bg-warning'}`}>
                    {sale.status}
                  </span>
                </td>
                <td>
                  <div className="btn-group" role="group">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleCancelSale(sale._id)}
                      title="Cancelar venta"
                      disabled={sale.status !== 'Completada'}
                    >
                      <i className="fas fa-ban"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && (
          <div className="text-center p-3">
            <p>No hay ventas registradas</p>
          </div>
        )}
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
                    onChange={(e) => {
                      const customer = customers.find(c => c._id === e.target.value);
                      setSelectedCustomer(customer || null);
                    }}
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.document}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Método de pago */}
                <div className="mb-3">
                  <label className="form-label">Método de Pago</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Crédito">Crédito</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
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
                          ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <button 
                  className="btn btn-primary w-100"
                  onClick={handleCreateSale}
                  disabled={cart.length === 0 || !selectedCustomer}
                >
                  {editingSale ? 'Actualizar Venta' : 'Completar Venta'}
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