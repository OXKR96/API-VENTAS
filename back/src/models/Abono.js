// src/models/Abono.js
const mongoose = require('mongoose');

const abonoSchema = new mongoose.Schema({
  credito: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credito',
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  sucursal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sucursal'
  },
  comercial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaAbono: {
    type: Date,
    default: Date.now
  }
});

const Abono = mongoose.model('Abono', abonoSchema);
module.exports = Abono;