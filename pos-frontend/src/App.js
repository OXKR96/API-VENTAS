import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/login';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Suppliers from './components/Suppliers';
import Purchases from './components/Purchases';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } />
        <Route path="/sales" element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        } />

        <Route path="/purchases" element={
        <ProtectedRoute>
            <Purchases />
        </ProtectedRoute>
        } />


        <Route path="/suppliers" element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;