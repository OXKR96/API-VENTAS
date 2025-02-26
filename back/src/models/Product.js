const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingresa el nombre del producto'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'Por favor ingresa el precio'],
    min: [0, 'El precio no puede ser negativo']
  },
  costPrice: {
    type: Number,
    required: [true, 'Por favor ingresa el precio de costo'],
    min: [0, 'El precio de costo no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'Por favor ingresa el stock'],
    min: [0, 'El stock no puede ser negativo']
  },
  category: {
    type: String,
    required: [true, 'Por favor selecciona una categoría'],
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  brand: {
    type: String,
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minimumStock: {
    type: Number,
    default: 5
  },
  taxes: {
    type: Number,
    default: 0,
    min: [0, 'Los impuestos no pueden ser negativos']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular el precio con impuestos
ProductSchema.virtual('priceWithTax').get(function() {
  return this.price * (1 + this.taxes / 100);
});

// Método para verificar si el stock está bajo
ProductSchema.methods.isLowStock = function() {
  return this.stock <= this.minimumStock;
};

// Middleware para validar stock antes de guardar
ProductSchema.pre('save', function(next) {
  if (this.stock < 0) {
    return next(new Error('El stock no puede ser negativo'));
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);