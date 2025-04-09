// src/routes/creditoRoutes.js
const express = require('express');
const router = express.Router();
const { 
  simularCredito,
  validarCliente,
  crearCredito,
  getCreditos
} = require('../controllers/creditoController');
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/simular', simularCredito);

// Rutas protegidas
router.use(protect);
router.post('/validar-cliente', validarCliente);
router.post('/', crearCredito);
router.get('/', getCreditos);

module.exports = router;