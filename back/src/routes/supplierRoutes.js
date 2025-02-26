// src/routes/supplierRoutes.js
const express = require('express');
const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
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

module.exports = router;