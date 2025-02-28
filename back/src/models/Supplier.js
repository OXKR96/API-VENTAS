const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  contactName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    required: [true, 'El CC/NIT es requerido'],
    trim: true,
    unique: true
  },
  paymentTerms: {
    type: String,
    required: [true, 'Los términos de pago son requeridos'],
    enum: {
      values: [
        'Contado',
        '7 días',
        '15 días',
        '21 días',
        '30 días',
        '45 días',
        '60 días',
        '90 días',
        'Fin de mes',
        'Contra entrega',
        'Pago anticipado'
      ],
      message: 'Términos de pago no válidos'
    },
    default: 'Contado'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar las búsquedas
supplierSchema.index({ name: 1 });
supplierSchema.index({ taxId: 1 }, { unique: true });
supplierSchema.index({ isActive: 1 });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;