// src/controllers/usuarioController.js
const Usuario = require('../models/Usuario');
const Sucursal = require('../models/sucursal');

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Private/Admin
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({}).populate('sucursal');
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Crear un nuevo usuario
// @route   POST /api/usuarios
// @access  Private/Admin
exports.crearUsuario = async (req, res) => {
  try {
    const { documento, nombre, apellido, cargo, tipo, telefono, email, password, sucursal } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Verificar si el documento ya existe
    const documentoExiste = await Usuario.findOne({ documento });
    if (documentoExiste) {
      return res.status(400).json({ message: 'El documento ya está registrado' });
    }

    // Verificar si la sucursal existe (si se proporciona)
    if (sucursal) {
      const sucursalExiste = await Sucursal.findById(sucursal);
      if (!sucursalExiste) {
        return res.status(404).json({ message: 'Sucursal no encontrada' });
      }
    }

    // Crear nuevo usuario
    const usuario = await Usuario.create({
      documento,
      nombre,
      apellido,
      cargo,
      tipo,
      telefono,
      email,
      password,
      sucursal
    });

    res.status(201).json({
      _id: usuario._id,
      documento: usuario.documento,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      cargo: usuario.cargo,
      tipo: usuario.tipo,
      estado: usuario.estado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/usuarios/:id
// @access  Private/Admin
exports.getUsuarioById = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password').populate('sucursal');
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/usuarios/:id
// @access  Private/Admin
exports.actualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Actualizar campos
    usuario.nombre = req.body.nombre || usuario.nombre;
    usuario.apellido = req.body.apellido || usuario.apellido;
    usuario.cargo = req.body.cargo || usuario.cargo;
    usuario.tipo = req.body.tipo || usuario.tipo;
    usuario.telefono = req.body.telefono || usuario.telefono;
    usuario.email = req.body.email || usuario.email;
    usuario.sucursal = req.body.sucursal || usuario.sucursal;
    usuario.estado = req.body.estado || usuario.estado;
    
    // Si se proporciona una contraseña nueva
    if (req.body.password) {
      usuario.password = req.body.password;
    }
    
    const updatedUsuario = await usuario.save();
    
    res.json({
      _id: updatedUsuario._id,
      nombre: updatedUsuario.nombre,
      apellido: updatedUsuario.apellido,
      cargo: updatedUsuario.cargo,
      tipo: updatedUsuario.tipo,
      email: updatedUsuario.email,
      estado: updatedUsuario.estado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// En tu controlador usuarioController.js
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    usuario.password = password;
    await usuario.save();
    
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    await Usuario.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};