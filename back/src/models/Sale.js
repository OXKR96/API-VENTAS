const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo']
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const SaleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [SaleItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'],
    required: true
  },
  status: {
    type: String,
    enum: ['Completada', 'Cancelada', 'Pendiente'],
    default: 'Completada'
  },
  customer: {
    name: String,
    email: String,
    phone: String,
    document: String
  },
  notes: String,
  discount: {
    type: Number,
    default: 0,
    min: [0, 'El descuento no puede ser negativo']
  },
  taxes: {
    type: Number,
    default: 0,
    min: [0, 'Los impuestos no pueden ser negativos']
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  taxDetails: {
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    total: Number
  },
  saleDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Método para generar número de factura
SaleSchema.methods.generateInvoiceNumber = function() {
  const prefix = 'VTA';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  return `${prefix}-${year}${month}${day}-${randomPart}`;
};

module.exports = mongoose.model('Sale', SaleSchema);