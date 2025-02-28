import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';
import { Container, Table, Badge, Button } from 'react-bootstrap';

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newCostPrice, setNewCostPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [startDate, endDate, statusFilter, paymentMethodFilter, searchQuery]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product._id.toString().includes(searchTerm)
      );
      setFilteredProducts(filtered);
      setShowProductSearch(true);
    } else {
      setFilteredProducts([]);
      setShowProductSearch(false);
    }
  }, [searchTerm, products]);

  const loadInitialData = async () => {
    try {
      const [productsRes, suppliersRes, purchasesRes] = await Promise.all([
        api.getProducts(),
        api.getSuppliers(),
        api.getPurchases({
          startDate,
          endDate,
          status: statusFilter !== 'Todos' ? statusFilter : undefined,
          paymentMethod: paymentMethodFilter !== 'Todos' ? paymentMethodFilter : undefined,
          search: searchQuery
        })
      ]);

      // Filtrar solo proveedores activos
      const activeSuppliers = suppliersRes.data.filter(supplier => 
        supplier.status === 'Activo' || supplier.status === 'activo'
      );
      console.log('Proveedores activos:', activeSuppliers); // Para debugging

      setProducts(productsRes.data);
      setSuppliers(activeSuppliers); // Guardamos solo los proveedores activos
      setPurchases(purchasesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos iniciales');
    }
  };

  const handleAddToCart = (product, price) => {
    if (!price || isNaN(price) || price <= 0) {
      toast.error('Por favor ingrese un precio de costo válido');
      return;
    }

    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      toast.warning('Este producto ya está en el carrito. Modifique su cantidad si desea más unidades.');
      return;
    }

    setCart([...cart, { 
      ...product, 
      quantity: 1,
      costPrice: parseFloat(price)
    }]);
    setSearchTerm('');
    toast.success('Producto agregado al carrito');
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    
    if (!newCostPrice || isNaN(newCostPrice) || parseFloat(newCostPrice) <= 0) {
      toast.error('Por favor ingrese un precio de costo válido mayor a 0');
      return;
    }

    setCart([...cart, { 
      ...selectedProduct, 
      quantity: 1,
      costPrice: parseFloat(newCostPrice)
    }]);
    setSearchTerm('');
    setShowProductSearch(false);
    setSelectedProduct(null);
    setNewCostPrice('');
    toast.success('Producto agregado al carrito');
  };

  const updateCartItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      toast.warning('La cantidad debe ser mayor a 0');
      return;
    }

    const newCart = [...cart];
    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const updateCartItemPrice = (index, newPrice) => {
    if (newPrice <= 0) {
      toast.warning('El precio debe ser mayor a 0');
      return;
    }

    const newCart = [...cart];
    newCart[index].costPrice = newPrice;
    setCart(newCart);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedSupplier) {
        toast.warning('Por favor seleccione un proveedor');
        return;
      }

      if (cart.length === 0) {
        toast.warning('Agregue al menos un producto al carrito');
        return;
      }

      // Validar que todos los productos tengan precio de costo
      const invalidItems = cart.filter(item => !item.costPrice || item.costPrice <= 0);
      if (invalidItems.length > 0) {
        toast.error('Todos los productos deben tener un precio de costo válido');
        return;
      }

      const purchaseData = {
        supplier: selectedSupplier._id,
        items: cart.map(item => ({
          product: item._id,
          quantity: parseInt(item.quantity),
          costPrice: parseFloat(item.costPrice),
          name: item.name
        })),
        totalAmount: parseFloat(cart.reduce((sum, item) => 
          sum + (parseFloat(item.costPrice) * parseInt(item.quantity)), 0
        ).toFixed(2)),
        paymentMethod,
        status: 'Completada'
      };

      console.log('Datos de la compra a enviar:', purchaseData); // Para debugging

      if (editingPurchase) {
        await api.updatePurchase(editingPurchase._id, purchaseData);
        toast.success('Compra actualizada exitosamente');
      } else {
        try {
          const response = await api.createPurchase(purchaseData);
          console.log('Respuesta del servidor:', response); // Para debugging
          
          if (response.data && response.data.success) {
            toast.success('Compra registrada exitosamente');
            setShowModal(false);
            loadInitialData();
            resetForm();
          } else {
            throw new Error(response.data?.message || 'Error al registrar la compra');
          }
        } catch (error) {
          console.error('Error detallado:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar la compra';
      toast.error(errorMessage);
    }
  };

  const handleCancelPurchase = async (purchaseId) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta compra? Esta acción revertirá el stock de los productos.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/purchases/${purchaseId}/cancel`);
      
      if (response.data.success) {
        toast.success('Compra cancelada exitosamente');
        loadInitialData();
      } else {
        toast.error(response.data.message || 'Error al cancelar la compra');
      }
    } catch (error) {
      console.error('Error al cancelar la compra:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la compra');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPurchase = async (purchase) => {
    try {
      setSelectedPurchase(purchase);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al preparar la edición:', error);
      toast.error('Error al preparar la edición de la compra');
    }
  };

  const handleUpdatePurchase = async (updatedPurchase) => {
    try {
      setLoading(true);
      const response = await api.put(`/api/purchases/${updatedPurchase._id}`, updatedPurchase);
      
      if (response.data.success) {
        toast.success('Compra actualizada exitosamente');
        setShowEditModal(false);
        loadInitialData();
      } else {
        toast.error(response.data.message || 'Error al actualizar la compra');
      }
    } catch (error) {
      console.error('Error al actualizar la compra:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar la compra');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setSelectedSupplier(null);
    setPaymentMethod('Efectivo');
    setEditingPurchase(null);
    setSearchTerm('');
    setShowProductSearch(false);
  };

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

  const handleViewPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setShowModal(true);
  };

  const handleFilter = () => {
    loadInitialData();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('Todos');
    setPaymentMethodFilter('Todos');
    setSearchQuery('');
    loadInitialData();
  };

  const formatDateShort = (dateString) => {
    const options = { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between mb-4">
        <h2>Compras</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nueva Compra
        </button>
      </div>

      {/* Filtros */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por proveedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Fecha Inicio"
          />
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Fecha Fin"
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
          >
            <option value="Todos">Método de Pago</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Crédito">Crédito</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Estado</option>
            <option value="Completada">Completada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
        <div className="col-md-1">
          <button className="btn btn-outline-secondary w-100" onClick={handleClearFilters}>
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de compras */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Proveedor</th>
            <th>Fecha</th>
            <th>Método de Pago</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase._id}>
              <td>{purchase.purchaseNumber}</td>
              <td>{purchase.supplier?.name}</td>
              <td>{formatDateShort(purchase.createdAt)}</td>
              <td>{purchase.paymentMethod}</td>
              <td>${purchase.totalAmount.toLocaleString()}</td>
              <td>
                <Badge bg={purchase.status === 'Completada' ? 'success' : 'danger'}>
                  {purchase.status}
                </Badge>
              </td>
              <td className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2"
                  onClick={() => handleViewPurchase(purchase)}
                >
                  <i className="fas fa-eye"></i>
                </Button>
                {purchase.status !== 'Cancelada' && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleCancelPurchase(purchase._id)}
                    disabled={loading}
                  >
                    <i className="fas fa-ban"></i>
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de compra */}
      {showModal && !selectedPurchase && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva Compra</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Selección de proveedor */}
                <div className="mb-3">
                  <label className="form-label">Proveedor</label>
                  <select
                    className="form-select"
                    value={selectedSupplier?._id || ''}
                    onChange={(e) => {
                      const supplier = suppliers.find(s => s._id === e.target.value);
                      setSelectedSupplier(supplier || null);
                    }}
                    required
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
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
                    <option value="Transferencia">Transferencia</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>

                {/* Búsqueda de productos */}
                <div className="mb-3">
                  <label className="form-label">Buscar Producto</label>
                  <div className="input-group">
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

                  {showProductSearch && filteredProducts.length > 0 && (
                    <div className="list-group mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredProducts.map(product => (
                        <div 
                          key={product._id}
                          className="list-group-item list-group-item-action"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div><strong>{product.name}</strong></div>
                              <small>Stock actual: {product.stock}</small>
                            </div>
                            <div className="d-flex align-items-center">
                              <input
                                type="number"
                                className="form-control form-control-sm me-2"
                                placeholder="Precio"
                                style={{ width: '100px' }}
                                defaultValue={product.costPrice}
                                min="0"
                                step="0.01"
                              />
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  const input = e.target.previousElementSibling;
                                  handleAddToCart(product, parseFloat(input.value));
                                }}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Carrito de compra */}
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Costo</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value))}
                              min="1"
                              style={{ width: '80px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.costPrice}
                              onChange={(e) => updateCartItemPrice(index, parseFloat(e.target.value))}
                              min="0.01"
                              step="0.01"
                              style={{ width: '100px' }}
                            />
                          </td>
                          <td>${(item.quantity * item.costPrice).toLocaleString()}</td>
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
                        <td colSpan="3" className="text-end">
                          <strong>Total:</strong>
                        </td>
                        <td colSpan="2">
                          <strong>
                            ${cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0).toLocaleString()}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={!selectedSupplier || cart.length === 0}
                >
                  Guardar Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista de detalles */}
      {showModal && selectedPurchase && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles de la Compra</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPurchase(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {selectedPurchase && (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Proveedor:</strong> {selectedPurchase.supplier?.name}
                      </div>
                      <div className="col-md-6">
                        <strong>Fecha:</strong> {formatDate(selectedPurchase.createdAt)}
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Estado:</strong>{' '}
                        <Badge bg={selectedPurchase.status === 'Completada' ? 'success' : 
                                 selectedPurchase.status === 'Cancelada' ? 'danger' : 'warning'}>
                          {selectedPurchase.status}
                        </Badge>
                      </div>
                      <div className="col-md-6">
                        <strong>Método de Pago:</strong> {selectedPurchase.paymentMethod}
                      </div>
                    </div>
                    
                    <Table striped bordered>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio Costo</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPurchase.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>${item.costPrice.toLocaleString()}</td>
                            <td>${(item.quantity * item.costPrice).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-end">
                            <strong>Total:</strong>
                          </td>
                          <td>
                            <strong>${selectedPurchase.totalAmount.toLocaleString()}</strong>
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => {
                  setShowModal(false);
                  setSelectedPurchase(null);
                }}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default Purchases;