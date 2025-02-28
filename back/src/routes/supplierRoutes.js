// src/routes/supplierRoutes.js
const express = require('express');
const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'manager'), createSupplier)
  .get(protect, getAllSuppliers);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, authorize('admin', 'manager'), updateSupplier)
  .delete(protect, authorize('admin', 'manager'), deleteSupplier);

router.put('/:id/toggle-status', protect, authorize('admin', 'manager'), toggleSupplierStatus);

module.exports = router;