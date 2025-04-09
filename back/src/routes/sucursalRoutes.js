// src/routes/sucursalRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSucursales, 
  crearSucursal, 
  getSucursalById,
  actualizarSucursal
} = require('../controllers/sucursalController');
const { protect, admin } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los usuarios
router.get('/', getSucursales);
router.get('/:id', getSucursalById);

// Rutas para administradores
router.post('/', admin, crearSucursal);
router.put('/:id', admin, actualizarSucursal);

module.exports = router;