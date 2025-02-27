import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    loadInitialData();
  }, []);

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
        api.getPurchases()
      ]);
      setProducts(productsRes.data);
      setSuppliers(suppliersRes.data);
      setPurchases(purchasesRes.data);
    } catch (error) {
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
        totalAmount: cart.reduce((sum, item) => sum + (parseFloat(item.costPrice) * parseInt(item.quantity)), 0),
        paymentMethod,
        status: 'Completada'
      };

      if (editingPurchase) {
        await api.updatePurchase(editingPurchase._id, purchaseData);
        toast.success('Compra actualizada exitosamente');
      } else {
        await api.createPurchase(purchaseData);
        toast.success('Compra registrada exitosamente');
      }

      setShowModal(false);
      loadInitialData();
      resetForm();
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      toast.error(error.response?.data?.message || 'Error al procesar la compra');
    }
  };

  const handleCancelPurchase = async (id) => {
    if (window.confirm('¿Está seguro de cancelar esta compra? El stock de los productos será actualizado.')) {
      try {
        await api.cancelPurchase(id);
        toast.success('Compra cancelada exitosamente');
        loadInitialData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cancelar la compra');
      }
    }
  };

  const handleEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    setSelectedSupplier(purchase.supplier);
    setPaymentMethod(purchase.paymentMethod);
    setCart(purchase.items.map(item => ({
      ...item,
      _id: item.product
    })));
    setShowModal(true);
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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Compras</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nueva Compra
        </button>
      </div>

      {/* Tabla de compras */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Método de Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase._id}>
                <td>{formatDate(purchase.createdAt)}</td>
                <td>{purchase.supplier?.name}</td>
                <td>
                  <ul className="list-unstyled mb-0">
                    {purchase.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - ${item.price}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>${purchase.totalAmount}</td>
                <td>{purchase.paymentMethod}</td>
                <td>
                  <span className={`badge ${purchase.status === 'Completada' ? 'bg-success' : 'bg-warning'}`}>
                    {purchase.status}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEditPurchase(purchase)}
                      title="Editar compra"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger ms-1"
                      onClick={() => handleCancelPurchase(purchase._id)}
                      title="Cancelar compra"
                    >
                      <i className="fas fa-ban"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de compra */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
                </h5>
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
                      autoFocus
                    />
                  </div>

                  {showProductSearch && (
                    <div className="list-group position-absolute w-100 shadow-lg" style={{ maxHeight: '300px', overflowY: 'auto', zIndex: 1000 }}>
                      {filteredProducts.map(product => (
                        <div 
                          key={product._id}
                          className="list-group-item list-group-item-action"
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="row align-items-center g-2">
                            <div className="col">
                              <div className="d-flex justify-content-between">
                                <strong>{product.name}</strong>
                                <span className="badge bg-info">
                                  Precio actual: ${product.costPrice || 0}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between">
                                <small className="text-muted">Código: {product._id}</small>
                                <small className="text-muted">Stock: {product.stock}</small>
                              </div>
                            </div>
                            <div className="col-auto">
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">$</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Nuevo precio"
                                  defaultValue={product.costPrice || ''}
                                  style={{ width: '120px' }}
                                  min="0.01"
                                  step="0.01"
                                  id={`price-input-${product._id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const price = parseFloat(e.target.value);
                                      if (price > 0) {
                                        handleAddToCart(product, price);
                                      } else {
                                        toast.error('Ingrese un precio válido');
                                      }
                                    }
                                  }}
                                />
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const priceInput = document.getElementById(`price-input-${product._id}`);
                                    const price = parseFloat(priceInput.value);
                                    handleAddToCart(product, price);
                                  }}
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Carrito de compra */}
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
                          />
                        </td>
                        <td>${(item.costPrice * item.quantity).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              const newCart = cart.filter((_, i) => i !== index);
                              setCart(newCart);
                              toast.info('Producto eliminado del carrito');
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
                          ${cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <button
                  className="btn btn-primary w-100"
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || !selectedSupplier}
                >
                  {editingPurchase ? 'Actualizar Compra' : 'Registrar Compra'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;