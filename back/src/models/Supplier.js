const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingresa el nombre del proveedor'],
    trim: true
  },
  contactName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un correo electrónico válido']
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
    unique: true,
    sparse: true
  },
  paymentTerms: {
    type: String,
    enum: ['Contado', '15 días', '30 días', '60 días']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', SupplierSchema);