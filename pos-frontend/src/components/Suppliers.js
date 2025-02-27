import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [currentSupplier, setCurrentSupplier] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 'Contado',
    isActive: true
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const paymentTermsOptions = [
    'Contado',
    '15 días',
    '30 días',
    '60 días'
  ];

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await api.getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      setError('Error al cargar proveedores');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentSupplier._id) {
        await api.updateSupplier(currentSupplier._id, currentSupplier);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await api.createSupplier(currentSupplier);
        toast.success('Proveedor creado exitosamente');
      }
      setShowModal(false);
      loadSuppliers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la operación');
    }
  };

  const toggleActive = async (supplier) => {
    try {
      const updatedSupplier = {
        ...supplier,
        isActive: !supplier.isActive
      };
      await api.updateSupplier(supplier._id, updatedSupplier);
      loadSuppliers();
    } catch (error) {
      setError('Error al actualizar el estado del proveedor');
    }
  };

  const resetForm = () => {
    setCurrentSupplier({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      paymentTerms: 'Contado',
      isActive: true
    });
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        await api.deleteSupplier(id);
        toast.success('Proveedor eliminado exitosamente');
        loadSuppliers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar el proveedor');
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between mb-4">
        <h2>Proveedores</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nuevo Proveedor
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Términos de Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier._id} className={!supplier.isActive ? 'table-secondary' : ''}>
                <td>{supplier.name}</td>
                <td>{supplier.contactName}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.paymentTerms}</td>
                <td>
                  <span className={`badge ${supplier.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => {
                      setCurrentSupplier(supplier);
                      setShowModal(true);
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className={`btn btn-sm ${supplier.isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => toggleActive(supplier)}
                  >
                    {supplier.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {currentSupplier._id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                      value={currentSupplier.name}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        name: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nombre de Contacto</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentSupplier.contactName || ''}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        contactName: e.target.value
                      })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={currentSupplier.email || ''}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        email: e.target.value
                      })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentSupplier.phone || ''}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        phone: e.target.value
                      })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <textarea
                      className="form-control"
                      value={currentSupplier.address || ''}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        address: e.target.value
                      })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">NIT/RUT</label>
                    <input
                      type="text"
                      className="form-control"
                      value={currentSupplier.taxId || ''}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        taxId: e.target.value
                      })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Términos de Pago</label>
                    <select
                      className="form-select"
                      value={currentSupplier.paymentTerms}
                      onChange={(e) => setCurrentSupplier({
                        ...currentSupplier,
                        paymentTerms: e.target.value
                      })}
                    >
                      {paymentTermsOptions.map(term => (
                        <option key={term} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>

                  {currentSupplier._id && (
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          checked={currentSupplier.isActive}
                          onChange={(e) => setCurrentSupplier({
                            ...currentSupplier,
                            isActive: e.target.checked
                          })}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Proveedor Activo
                        </label>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary w-100">
                    {currentSupplier._id ? 'Actualizar' : 'Crear'}
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

export default Suppliers;