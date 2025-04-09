const express = require('express');
const router = express.Router();
const { 
  getClientes, 
  getClienteById, 
  getClienteByCedula, 
  createCliente, 
  updateCliente, 
  deleteCliente 
} = require('../controllers/clienteController');
const { protect } = require('../middleware/authMiddleware');

// Proteger todas las rutas con middleware de autenticación
router.use(protect);

// Ruta para buscar por cédula - IMPORTANTE: esta ruta debe ir antes de /:id
router.get('/cedula/:cedula', getClienteByCedula);

// Rutas para /api/clientes
router.route('/')
  .get(getClientes)
  .post(createCliente);

// Rutas para /api/clientes/:id
router.route('/:id')
  .get(getClienteById)
  .put(updateCliente)
  .delete(deleteCliente);

module.exports = router;