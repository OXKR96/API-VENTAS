// src/models/Liquidacion.js
const mongoose = require('mongoose');

const liquidacionSchema = new mongoose.Schema({
  sucursal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sucursal',
    required: true
  },
  montoDisponible: {
    type: Number,
    required: true
  },
  comision: {
    type: Number,
    required: true
  },
  iva: {
    type: Number,
    required: true
  },
  montoLiquidado: {
    type: Number,
    required: true
  },
  operaciones: {
    type: Number,
    required: true
  },
  fechaLiquidacion: {
    type: Date,
    default: Date.now
  },
  solicitadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Procesado', 'Pagado'],
    default: 'Pendiente'
  },
  cuentaReceptora: {
    type: String
  },
  banco: {
    type: String
  }
});

const Liquidacion = mongoose.model('Liquidacion', liquidacionSchema);
module.exports = Liquidacion;