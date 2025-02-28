// src/routes/purchaseRoutes.js
const express = require('express');
const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  cancelPurchase,
  updatePurchase,
  getPurchaseReport
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas públicas (para usuarios autenticados)
router.route('/')
  .get(getPurchases)
  .post(authorize('admin', 'manager'), createPurchase);

router.get('/reports', getPurchaseReport);
router.get('/:id', getPurchaseById);

// Rutas que requieren autorización
router.put('/:id/cancel', authorize('admin', 'manager'), cancelPurchase);
router.put('/:id', authorize('admin', 'manager'), updatePurchase);

module.exports = router;