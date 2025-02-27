const express = require('express');
const {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  registerPayment,
  getPaymentHistory,
  getCustomerStats
} = require('../controllers/customerController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/stats', protect, getCustomerStats);

// Rutas protegidas
router.route('/')
  .get(protect, getCustomers)
  .post(protect, authorize('admin', 'manager'), createCustomer);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, authorize('admin', 'manager'), updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

router.route('/:id/payments')
  .post(protect, authorize('admin', 'manager'), registerPayment)
  .get(protect, getPaymentHistory);

module.exports = router; 