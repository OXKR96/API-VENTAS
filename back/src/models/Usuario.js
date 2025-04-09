// src/models/Usuario.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  documento: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  cargo: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Administrativo', 'Comercial', 'Super Usuario'],
    required: true
  },
  telefono: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  sucursal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sucursal'
  },
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo'],
    default: 'Activo'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Método para comparar contraseñas
usuarioSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware para encriptar contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
module.exports = Usuario;