// src/models/Cliente.js
const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  cedula: {
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
  telefono: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  direccion: {
    type: String
  },
  fechaNacimiento: {
    type: Date
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

const Cliente = mongoose.model('Cliente', clienteSchema);
module.exports = Cliente;