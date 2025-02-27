import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

function Products() {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    price: '',
    costPrice: '',
    stock: '',
    category: '',
    brand: '',
    minimumStock: '5'
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [localCategories, setLocalCategories] = useState([
    'Electrónica',
    'Ropa',
    'Alimentos',
    'Bebidas',
    'Hogar',
    'Oficina',
    'Otros'
  ]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [editingCategory, setEditingCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.data);
    } catch (error) {
      setError('Error al cargar productos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...currentProduct,
        price: Number(currentProduct.price),
        costPrice: Number(currentProduct.costPrice),
        stock: Number(currentProduct.stock),
        minimumStock: Number(currentProduct.minimumStock)
      };

      if (currentProduct._id) {
        await api.updateProduct(currentProduct._id, productData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await api.createProduct(productData);
        toast.success('Producto creado exitosamente');
      }
      setShowModal(false);
      loadProducts();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la operación');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await api.deleteProduct(id);
        toast.success('Producto eliminado exitosamente');
        loadProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar el producto');
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() === '') {
      setError('El nombre de la categoría no puede estar vacío');
      return;
    }

    if (localCategories.includes(newCategory.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    try {
      const updatedCategories = [...localCategories, newCategory.trim()];
      setLocalCategories(updatedCategories);
      setCurrentProduct({
        ...currentProduct,
        category: newCategory.trim()
      });
      setNewCategory('');
      setShowCategoryInput(false);
      setError('');
    } catch (error) {
      setError('Error al agregar la categoría');
    }
  };

  const handleEditCategory = (oldCategory, newName) => {
    if (newName.trim() === '') {
      setError('El nombre de la categoría no puede estar vacío');
      return;
    }

    if (localCategories.find(cat => cat !== oldCategory && cat === newName.trim())) {
      setError('Esta categoría ya existe');
      return;
    }

    try {
      const updatedCategories = localCategories.map(cat => 
        cat === oldCategory ? newName.trim() : cat
      );
      setLocalCategories(updatedCategories);
      
      if (currentProduct.category === oldCategory) {
        setCurrentProduct({
          ...currentProduct,
          category: newName.trim()
        });
      }

      setEditingCategory('');
      setError('');
    } catch (error) {
      setError('Error al actualizar la categoría');
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        const updatedCategories = localCategories.filter(cat => cat !== categoryToDelete);
        setLocalCategories(updatedCategories);
        
        if (currentProduct.category === categoryToDelete) {
          setCurrentProduct({
            ...currentProduct,
            category: ''
          });
        }
      } catch (error) {
        setError('Error al eliminar la categoría');
      }
    }
  };

  const resetForm = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: '',
      costPrice: '',
      stock: '',
      category: '',
      brand: '',
      minimumStock: '5'
    });
    setError('');
    setShowCategoryInput(false);
    setNewCategory('');
    setEditingCategory('');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Productos</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nuevo Producto
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>${product.price.toLocaleString()}</td>
                <td>${product.costPrice.toLocaleString()}</td>
                <td>{product.stock}</td>
                <td>{product.category}</td>
                <td>{product.brand}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => {
                      setCurrentProduct(product);
                      setShowModal(true);
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(product._id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentProduct._id ? 'Editar Producto' : 'Nuevo Producto'}
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
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentProduct.name}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        name: e.target.value
                      })}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      value={currentProduct.description || ''}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
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
                        value={currentProduct.price}
                        onChange={(e) => setCurrentProduct({
                          ...currentProduct,
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
                        value={currentProduct.costPrice}
                        onChange={(e) => setCurrentProduct({
                          ...currentProduct,
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
                      <label className="form-label">Stock *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={currentProduct.stock}
                        onChange={(e) => setCurrentProduct({
                          ...currentProduct,
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
                        value={currentProduct.minimumStock}
                        onChange={(e) => setCurrentProduct({
                          ...currentProduct,
                          minimumStock: e.target.value
                        })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Categoría *</label>
                    <div className="input-group mb-2">
                      <select
                        className="form-select"
                        value={currentProduct.category}
                        onChange={(e) => setCurrentProduct({
                          ...currentProduct,
                          category: e.target.value
                        })}
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {localCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-outline-primary"
                        onClick={() => setShowCategoryInput(!showCategoryInput)}
                      >
                        Gestionar Categorías
                      </button>
                    </div>

                    {showCategoryInput && (
                      <div className="card border-primary">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
                          <h6 className="mb-0">Gestionar Categorías</h6>
                          <button 
                            type="button" 
                            className="btn-close btn-close-white"
                            onClick={() => {
                              setShowCategoryInput(false);
                              setEditingCategory('');
                              setNewCategory('');
                            }}
                          ></button>
                        </div>
                        <div className="card-body">
                          <div className="input-group mb-3">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Nueva categoría"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCategory();
                                }
                              }}
                            />
                            <button 
                              type="button" 
                              className="btn btn-success"
                              onClick={handleAddCategory}
                            >
                              Agregar
                            </button>
                          </div>

                          <div className="list-group">
                            {localCategories.map(cat => (
                              <div key={cat} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
                                {editingCategory === cat ? (
                                  <div className="input-group">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      defaultValue={cat}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleEditCategory(cat, e.target.value);
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success"
                                      onClick={(e) => handleEditCategory(cat, e.target.previousSibling.value)}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => setEditingCategory('')}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span>{cat}</span>
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => setEditingCategory(cat)}
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleDeleteCategory(cat)}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Marca</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentProduct.brand || ''}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        brand: e.target.value
                      })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    {currentProduct._id ? 'Actualizar' : 'Crear'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;