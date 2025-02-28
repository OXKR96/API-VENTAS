const mongoose = require('mongoose');

const PurchaseItemSchema = new mongoose.Schema({
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
  costPrice: {
    type: Number,
    required: true,
    min: [0, 'El precio de costo no puede ser negativo']
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const PurchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: Number,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [PurchaseItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Transferencia', 'Crédito'],
    required: true
  },
  status: {
    type: String,
    enum: ['Completada', 'Cancelada'],
    default: 'Completada'
  },
  notes: String,
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para auto-incrementar el purchaseNumber
PurchaseSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastPurchase = await this.constructor.findOne({}, {}, { sort: { purchaseNumber: -1 } });
    this.purchaseNumber = lastPurchase ? lastPurchase.purchaseNumber + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Purchase', PurchaseSchema);