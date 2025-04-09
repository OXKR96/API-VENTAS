// src/routes/abonoRoutes.js
const express = require('express');
const router = express.Router();
const { 
  registrarAbono,
  getAbonos
} = require('../controllers/abonoController');
const { protect } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

router.post('/', registrarAbono);
router.get('/', getAbonos);

module.exports = router;