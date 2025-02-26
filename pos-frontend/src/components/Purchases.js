import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

function Purchases() {
  // Estados para la gestión de compras
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentPurchase, setCurrentPurchase] = useState({
    supplier: '',
    items: [],
    paymentMethod: 'Contado',
    notes: '',
    status: 'Completada'
  });

  // Estados para modales y errores
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [error, setError] = useState('');

  // Estados para la gestión de productos
  const [selectedProduct, setSelectedProduct] = useState({
    product: '',
    quantity: 1,
    costPrice: 0
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    category: 'Otros',
    minimumStock: '5'
  });

  const paymentMethods = ['Contado', 'Crédito', 'Transferencia'];

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [purchasesData, suppliersData, productsData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts()
      ]);

      setPurchases(purchasesData.data);
      setSuppliers(suppliersData.data.filter(s => s.isActive));
      setProducts(productsData.data);
    } catch (error) {
      setError('Error al cargar datos iniciales');
    }
  };

  // Funciones para gestión de compras
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentPurchase.items.length === 0) {
        setError('Debe agregar al menos un producto');
        return;
      }

      const purchaseData = {
        ...currentPurchase,
        totalAmount: currentPurchase.items.reduce((sum, item) => 
          sum + (item.quantity * item.costPrice), 0
        )
      };

      await api.createPurchase(purchaseData);
      setShowModal(false);
      loadInitialData();
      resetForm();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar la compra');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await api.getPurchaseById(id);
      setSelectedPurchase(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      setError('Error al cargar los detalles de la compra');
    }
  };

  // Funciones para gestión de productos en la compra
  const handleAddItem = () => {
    if (!selectedProduct.product || selectedProduct.quantity <= 0 || selectedProduct.costPrice <= 0) {
      setError('Por favor complete todos los campos del producto');
      return;
    }

    const product = products.find(p => p._id === selectedProduct.product);
    
    setCurrentPurchase(prev => ({
      ...prev,
      items: [...prev.items, {
        ...selectedProduct,
        productName: product.name,
        subtotal: selectedProduct.quantity * selectedProduct.costPrice
      }]
    }));

    setSelectedProduct({
      product: '',
      quantity: 1,
      costPrice: 0
    });
    setShowProductSearch(false);
  };

  const handleRemoveItem = (index) => {
    setCurrentPurchase(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleQuickProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        price: Number(newProduct.price),
        costPrice: Number(newProduct.costPrice),
        stock: Number(newProduct.stock),
        minimumStock: Number(newProduct.minimumStock)
      };

      const response = await api.createProduct(productData);
      const createdProduct = response.data;
      
      setProducts([...products, createdProduct]);
      setSelectedProduct({
        product: createdProduct._id,
        quantity: 1,
        costPrice: createdProduct.costPrice
      });
      
      setShowQuickProductModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        costPrice: '',
        stock: '',
        category: 'Otros',
        minimumStock: '5'
      });
    } catch (error) {
      setError('Error al crear el producto');
    }
  };

  const resetForm = () => {
    setCurrentPurchase({
      supplier: '',
      items: [],
      paymentMethod: 'Contado',
      notes: '',
      status: 'Completada'
    });
    setSelectedProduct({
      product: '',
      quantity: 1,
      costPrice: 0
    });
    setError('');
    setShowProductSearch(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Compras</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nueva Compra
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabla de compras */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Total</th>
              <th>Método de Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => (
              <tr key={purchase._id}>
                <td>{formatDate(purchase.createdAt)}</td>
                <td>{purchase.supplier?.name}</td>
                <td>${purchase.totalAmount?.toLocaleString()}</td>
                <td>{purchase.paymentMethod}</td>
                <td>
                  <span className={`badge ${
                    purchase.status === 'Completada' ? 'bg-success' : 
                    purchase.status === 'Pendiente' ? 'bg-warning' : 
                    'bg-danger'
                  }`}>
                    {purchase.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-info me-2"
                    onClick={() => handleViewDetails(purchase._id)}
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Nueva Compra */}
      {showModal && (
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
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Proveedor *</label>
                    <select
                      className="form-select"
                      value={currentPurchase.supplier}
                      onChange={(e) => setCurrentPurchase({
                        ...currentPurchase,
                        supplier: e.target.value
                      })}
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map(supplier => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="card mb-3">
                    <div className="card-header">
                      <h6 className="mb-0">Agregar Productos</h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-md-12">
                          <div className="dropdown">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Buscar producto..."
                              onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                const filteredProducts = products.filter(p => 
                                  p.name.toLowerCase().includes(searchTerm)
                                );
                                setFilteredProducts(filteredProducts);
                                setShowProductSearch(searchTerm.length > 0);
                              }}
                            />
                            {showProductSearch && (
                              <div className="dropdown-menu show w-100">
                                {filteredProducts.map(product => (
                                  <button
                                    key={product._id}
                                    className="dropdown-item"
                                    type="button"
                                    onClick={() => {
                                      setSelectedProduct({
                                        product: product._id,
                                        quantity: 1,
                                        costPrice: product.costPrice
                                      });
                                      setShowProductSearch(false);
                                    }}
                                  >
                                    {product.name} - Stock: {product.stock}
                                  </button>
                                ))}
                                <div className="dropdown-divider"></div>
                                <button
                                  className="dropdown-item text-primary"
                                  type="button"
                                  onClick={() => {
                                    setShowQuickProductModal(true);
                                    setShowProductSearch(false);
                                  }}
                                >
                                  + Crear Nuevo Producto
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedProduct.product && (
                        <div className="row mb-3 align-items-end">
                          <div className="col-md-4">
                            <label className="form-label">Producto Seleccionado</label>
                            <input
                              type="text"
                              className="form-control"
                              value={products.find(p => p._id === selectedProduct.product)?.name || ''}
                              disabled
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Cantidad</label>
                            <input
                              type="number"
                              className="form-control"
                              value={selectedProduct.quantity}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                quantity: parseInt(e.target.value)
                              })}
                              min="1"
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Precio Costo</label>
                            <input
                              type="number"
                              className="form-control"
                              value={selectedProduct.costPrice}
                              onChange={(e) => setSelectedProduct({
                                ...selectedProduct,
                                costPrice: parseFloat(e.target.value)
                              })}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-success w-100"
                              onClick={handleAddItem}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      )}

                      <table className="table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPurchase.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.productName}</td>
                              <td>{item.quantity}</td>
                              <td>${item.costPrice.toLocaleString()}</td>
                              <td>${(item.quantity * item.costPrice).toLocaleString()}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                            <td colSpan="2">
                              <strong>
                                ${currentPurchase.items.reduce((sum, item) => 
                                  sum + (item.quantity * item.costPrice), 0
                                ).toLocaleString()}
                              </strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Método de Pago</label>
                        <select
                          className="form-select"
                          value={currentPurchase.paymentMethod}
                          onChange={(e) => setCurrentPurchase({
                            ...currentPurchase,
                            paymentMethod: e.target.value
                          })}
                        >
                          {paymentMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notas</label>
                    <textarea
                      className="form-control"
                      value={currentPurchase.notes}
                      onChange={(e) => setCurrentPurchase({
                        ...currentPurchase,
                        notes: e.target.value
                      })}
                      rows="3"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    Crear Compra
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Producto Rápido */}
      {showQuickProductModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Producto Rápido</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowQuickProductModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleQuickProductSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        name: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({
                        ...newProduct,
                        description: e.target.value
                      })}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Precio Venta *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          price: e.target.value
                        })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Precio Costo *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.costPrice}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          costPrice: e.target.value
                        })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock Inicial *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          stock: e.target.value
                        })}
                        required
                        min="0"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Stock Mínimo</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newProduct.minimumStock}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          minimumStock: e.target.value
                        })}
                        min="0"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    Crear y Seleccionar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Compra */}
      {showDetailsModal && selectedPurchase && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles de la Compra</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPurchase(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Información de la Compra</h6>
                    <p><strong>Fecha:</strong> {formatDate(selectedPurchase.createdAt)}</p>
                    <p><strong>Proveedor:</strong> {selectedPurchase.supplier?.name}</p>
                    <p><strong>Método de Pago:</strong> {selectedPurchase.paymentMethod}</p>
                    <p><strong>Estado:</strong> {selectedPurchase.status}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Notas</h6>
                    <p>{selectedPurchase.notes || 'Sin notas'}</p>
                  </div>
                </div>

                <h6>Productos</h6>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>${item.costPrice.toLocaleString()}</td>
                        <td>${(item.quantity * item.costPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td>
                        <strong>${selectedPurchase.totalAmount.toLocaleString()}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPurchase(null);
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

export default Purchases;