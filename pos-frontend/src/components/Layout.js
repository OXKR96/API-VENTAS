import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export function Layout() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    api.logout();
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">POS System</Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  to="/dashboard"
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}
                  to="/products"
                >
                  Productos
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/sales' ? 'active' : ''}`}
                  to="/sales"
                >
                  Ventas
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/purchases' ? 'active' : ''}`}
                  to="/purchases"
                >
                  Compras
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/suppliers' ? 'active' : ''}`}
                  to="/suppliers"
                >
                  Proveedores
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${location.pathname === '/customers' ? 'active' : ''}`}
                  to="/customers"
                >
                  Clientes
                </Link>
              </li>
            </ul>
            <div className="navbar-nav">
              <span className="nav-item nav-link text-light">
                {user?.name}
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
      <Outlet />
    </>
  );
}

export default Layout; 