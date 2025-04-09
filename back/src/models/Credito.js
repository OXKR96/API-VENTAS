// src/models/Credito.js
const mongoose = require('mongoose');

const creditoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  sucursal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sucursal',
    required: true
  },
  comercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  plazo: {
    type: Number,
    required: true
  },
  valorCuota: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: ['Solicitado', 'En Validación', 'Aprobado', 'Rechazado', 'Finalizado'],
    default: 'Solicitado'
  },
  codigoVerificacion: {
    type: String
  },
  codigoEntrega: {
    type: String
  },
  fechaAprobacion: {
    type: Date
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

const Credito = mongoose.model('Credito', creditoSchema);
module.exports = Credito;