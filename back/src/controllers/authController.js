// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secreto123', {
    expiresIn: '30d',
  });
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que se ingresaron email y password
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor ingrese email y contraseña' });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email }).populate('sucursal');

    // Verificar si el usuario existe y la contraseña es correcta
    if (!usuario || !(await usuario.matchPassword(password))) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    // Verificar si el usuario está activo
    if (usuario.estado !== 'Activo') {
      return res.status(401).json({ message: 'Usuario inactivo. Contacte al administrador' });
    }

    // Retornar información del usuario y token
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      tipo: usuario.tipo,
      sucursal: usuario.sucursal,
      token: generateToken(usuario._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener perfil del usuario
// @route   GET /api/auth/perfil
// @access  Private
exports.getPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id).select('-password').populate('sucursal');
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};