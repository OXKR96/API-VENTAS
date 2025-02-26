import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          POS System
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/products">
                Productos
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/sales">
                Ventas
              </Link>
            </li>
                <li className="nav-item">
                <Link className="nav-link" to="/purchases">
                    Compras
                </Link>
                </li>
                    <li className="nav-item">
              <Link className="nav-link" to="/suppliers">
                Proveedores
              </Link>
            </li>
          </ul>
          <div className="d-flex align-items-center">
            <span className="text-light me-3">
              {user.name || 'Usuario'}
            </span>
            <button 
              className="btn btn-outline-light" 
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;