// src/routes/purchaseRoutes.js
const express = require('express');
const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  cancelPurchase,
  getPurchaseReport
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'manager'), createPurchase)
  .get(protect, getPurchases);

router.get('/reports', protect, getPurchaseReport);
router.get('/:id', protect, getPurchaseById);
router.delete('/:id', protect, authorize('admin', 'manager'), cancelPurchase);

module.exports = router;