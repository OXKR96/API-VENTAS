// src/routes/liquidacionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  calcularLiquidacion,
  crearLiquidacion,
  getLiquidaciones,
  actualizarLiquidacion
} = require('../controllers/liquidacionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación y ser administrador
router.use(protect);
router.use(admin);

router.post('/calcular', calcularLiquidacion);
router.post('/', crearLiquidacion);
router.get('/', getLiquidaciones);
router.put('/:id', actualizarLiquidacion);

module.exports = router;