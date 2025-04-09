// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getUsuarios, 
  crearUsuario, 
  getUsuarioById,
  actualizarUsuario,
  resetPassword,
  eliminarUsuario
} = require('../controllers/usuarioController');
const { protect, admin } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para administradores
router.route('/')
  .get(admin, getUsuarios)
  .post(admin, crearUsuario);

router.route('/:id')
  .get(admin, getUsuarioById)
  .put(admin, actualizarUsuario)
  .delete(admin, eliminarUsuario);

// Ruta para restablecer contraseña
router.put('/:id/reset-password', admin, resetPassword);

module.exports = router;