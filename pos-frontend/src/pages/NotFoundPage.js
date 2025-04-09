// src/pages/NotFoundPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const NotFoundPage = () => {
  return (
    <Layout>
      <div className="text-center py-5">
        <h1 className="display-1">404</h1>
        <h2>Página no encontrada</h2>
        <p className="lead">La página que estás buscando no existe</p>
        <Link to="/dashboard" className="btn btn-primary mt-3">
          Volver al Dashboard
        </Link>
      </div>
    </Layout>
  );
};

export default NotFoundPage;