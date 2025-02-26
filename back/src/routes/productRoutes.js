// src/routes/productRoutes.js
const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getProductCount
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getAllProducts)
  .post(protect, authorize('admin', 'manager'), createProduct);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('admin', 'manager'), updateProduct)
  .delete(protect, authorize('admin', 'manager'), deleteProduct);

router.put('/:id/stock', protect, authorize('admin', 'manager'), updateStock);
router.get('/stock/low', protect, getLowStockProducts);
router.get('/count', protect, getProductCount);

module.exports = router;