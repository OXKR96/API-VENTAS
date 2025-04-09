// src/models/Sucursal.js
const mongoose = require('mongoose');

const sucursalSchema = new mongoose.Schema({
  nombreComercial: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  },
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  estado: {
    type: String,
    enum: ['Activo', 'Inactivo'],
    default: 'Activo'
  },
  saldoDisponible: {
    type: Number,
    default: 0
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

const Sucursal = mongoose.model('Sucursal', sucursalSchema);
module.exports = Sucursal;