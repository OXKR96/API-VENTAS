const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  document: {
    type: String,
    required: [true, 'El documento es obligatorio'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentDebt: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['AL_DIA', 'EN_MORA', 'BLOQUEADO'],
    default: 'AL_DIA'
  },
  paymentHistory: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['PAGO', 'CARGO'],
      required: true
    },
    description: String,
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Método para actualizar el estado basado en la deuda
customerSchema.methods.updateStatus = function() {
  if (this.currentDebt <= 0) {
    this.status = 'AL_DIA';
  } else if (this.currentDebt > this.creditLimit) {
    this.status = 'BLOQUEADO';
  } else {
    this.status = 'EN_MORA';
  }
};

// Middleware para actualizar el estado antes de guardar
customerSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 