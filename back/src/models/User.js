// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tokenSchema = new mongoose.Schema({
  secret: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-elimina después de 24 horas
  }
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingresa tu nombre'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor ingresa tu correo electrónico'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un correo electrónico válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor ingresa una contraseña'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'manager'],
    default: 'employee'
  },
  activeTokens: [tokenSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hashear contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);