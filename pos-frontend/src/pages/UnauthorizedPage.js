// src/pages/UnauthorizedPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const UnauthorizedPage = () => {
  return (
    <Layout>
      <div className="text-center py-5">
        <h1 className="display-1 text-danger">403</h1>
        <h2>Acceso no autorizado</h2>
        <p className="lead">No tienes permisos para acceder a esta página</p>
        <Link to="/dashboard" className="btn btn-primary mt-3">
          Volver al Dashboard
        </Link>
      </div>
    </Layout>
  );
};

export default UnauthorizedPage;