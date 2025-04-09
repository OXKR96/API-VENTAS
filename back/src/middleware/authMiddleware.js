// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para proteger rutas
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Verificar que el token existe en el header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No autorizado, no se proporcionó token' });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto123');
    
    // Obtener usuario desde el id en el token
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario) {
      return res.status(401).json({ message: 'No autorizado, token inválido' });
    }
    
    // Verificar si el usuario está activo
    if (usuario.estado !== 'Activo') {
      return res.status(401).json({ message: 'Usuario inactivo. Contacte al administrador' });
    }
    
    // Agregar usuario al request
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'No autorizado, token inválido o expirado' });
  }
};

// Middleware para rutas de administradores
exports.admin = (req, res, next) => {
  if (req.usuario && (req.usuario.tipo === 'Administrativo' || req.usuario.tipo === 'Super Usuario')) {
    next();
  } else {
    res.status(403).json({ message: 'No autorizado, se requiere permisos de administrador' });
  }
};