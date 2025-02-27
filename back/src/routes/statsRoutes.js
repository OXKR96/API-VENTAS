const express = require('express');
const router = express.Router();
const { 
  getSalesStats, 
  getDebtStats, 
  getInventoryStats 
} = require('../controllers/statsController');

// Rutas de estadísticas
router.get('/sales', getSalesStats);
router.get('/debt', getDebtStats);
router.get('/inventory', getInventoryStats);

module.exports = router; 