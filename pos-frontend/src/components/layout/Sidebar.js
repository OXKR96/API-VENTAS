// src/components/layout/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faChartLine,
  faStore,
  faUsers,
  faHandHoldingDollar,
  faFileInvoiceDollar,
  faUserTie,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="sidebar bg-white shadow-sm d-flex flex-column" style={{ minHeight: '100vh', width: '250px' }}>
      <div className="p-3 border-bottom">
        <h5 className="m-0 fw-bold text-primary">CREDITOS</h5>
      </div>
      
      <div className="py-2">
        <Link to="/dashboard" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/dashboard') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faHome} className="me-3" />
          Dashboard
        </Link>
        
        <Link to="/simulador" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/simulador') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faChartLine} className="me-3" />
          Simulador
        </Link>
        
        <Link to="/operaciones" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/operaciones') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faHandHoldingDollar} className="me-3" />
          Operaciones
        </Link>
        
        <Link to="/sucursales" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/sucursales') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faStore} className="me-3" />
          Sucursales
        </Link>
        
        <Link to="/liquidacion" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/liquidacion') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-3" />
          Liquidación
        </Link>
        
        <Link to="/clientes" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/clientes') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faUsers} className="me-3" />
          Clientes
        </Link>
        
        <Link to="/usuarios" className={`sidebar-item d-flex align-items-center p-3 text-decoration-none ${isActive('/usuarios') ? 'bg-light text-primary' : 'text-dark'}`}>
          <FontAwesomeIcon icon={faUserTie} className="me-3" />
          Usuarios
        </Link>
      </div>
      
      <div className="mt-auto p-3 border-top">
        <button className="btn btn-outline-danger d-flex align-items-center w-100">
          <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;