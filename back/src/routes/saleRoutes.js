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

router.route('/')
  .post(protect, authorize('admin', 'employee'), createSale)
  .get(protect, authorize('admin', 'manager'), getSales);

router.get('/stats', protect, getSalesStats);
router.get('/date-range', protect, getSalesByDateRange);
router.get('/:id', protect, getSaleById);
router.put('/:id', protect, authorize('admin', 'manager'), updateSale);
router.put('/:id/cancel', protect, authorize('admin', 'manager'), cancelSale);

module.exports = router;