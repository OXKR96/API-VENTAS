// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  login,
  getPerfil 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/login', login);

// Rutas protegidas
router.get('/perfil', protect, getPerfil);

module.exports = router;