import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function Sales() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddToCart = (product) => {
    setCart([...cart, { ...product, quantity: 1 }]);
  };

  const handleCreateSale = async () => {
    try {
      const sale = {
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: 'Efectivo'
      };
      
      await api.createSale(sale);
      setCart([]);
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Ventas</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nueva Venta
        </button>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nueva Venta</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <select 
                    className="form-select"
                    onChange={(e) => {
                      const product = products.find(p => p._id === e.target.value);
                      if (product) handleAddToCart(product);
                    }}
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>
                </div>

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
                    {cart.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => {
                              const newCart = [...cart];
                              newCart[index].quantity = parseInt(e.target.value);
                              setCart(newCart);
                            }}
                            min="1"
                          />
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
                          ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <button 
                  className="btn btn-primary w-100"
                  onClick={handleCreateSale}
                  disabled={cart.length === 0}
                >
                  Completar Venta
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