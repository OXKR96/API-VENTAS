// src/routes/saleRoutes.js
const express = require('express');
const {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  getSalesByDateRange,
  getSalesStats,
  updateSale
} = require('../controllers/saleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas públicas (para usuarios autenticados)
router.route('/')
  .get(getSales)
  .post(createSale);

router.get('/stats', getSalesStats);
router.get('/date-range', getSalesByDateRange);
router.get('/:id', getSaleById);

// Rutas que requieren autorización
router.put('/:id/cancel', authorize('admin', 'manager'), cancelSale);
router.put('/:id', authorize('admin', 'manager'), updateSale);

module.exports = router;