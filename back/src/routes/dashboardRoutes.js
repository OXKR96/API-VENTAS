// src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getDashboardData,
  getActividad
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', getDashboardData);
router.get('/actividad', getActividad);

module.exports = router;