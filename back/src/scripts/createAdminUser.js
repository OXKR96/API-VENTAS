// scripts/createAdminUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Definir el esquema de Usuario - esto es necesario porque el script se ejecuta independientemente
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor proporcione un nombre'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Por favor proporcione un correo'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor proporcione un correo electrónico válido',
    ],
  },
  password: {
    type: String,
    required: [true, 'Por favor proporcione una contraseña'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'agent'],
    default: 'agent',
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Encriptar contraseña con bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', UserSchema);

const createAdminUser = async () => {
  try {
    console.log('Conectando a la base de datos...');
    
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conexión establecida con MongoDB');

    // Verificar si ya existe un usuario admin
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('---------------------------------------------');
      console.log('Ya existe un usuario administrador en el sistema');
      console.log('Email:', adminExists.email);
      console.log('---------------------------------------------');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Configuración del usuario administrador
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    // Crear usuario administrador
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      status: true
    });

    console.log('---------------------------------------------');
    console.log('Usuario administrador creado exitosamente:');
    console.log('Nombre:', admin.name);
    console.log('Email:', admin.email);
    console.log('Contraseña:', adminPassword);
    console.log('---------------------------------------------');
    console.log('Guarde estas credenciales en un lugar seguro');
    console.log('---------------------------------------------');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdminUser();