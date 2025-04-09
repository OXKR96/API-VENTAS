// Guardar como 'create-test-user.js' en la raíz de tu proyecto backend
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const colors = require('colors');

// Cargar variables de entorno
dotenv.config();

// Importar modelo de Usuario
const Usuario = require('./src/models/Usuario');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log(colors.cyan.bold('MongoDB Conectado'));
  
  try {
    // Crear un nuevo usuario de prueba
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const usuario = await Usuario.create({
      documento: "9876543210",
      nombre: "Admin",
      apellido: "Test",
      cargo: "Administrador",
      tipo: "Super Usuario",
      telefono: "3001234567",
      email: "admin@test.com",
      password: hashedPassword,
      estado: "Activo"
    });
    
    console.log(colors.green('Usuario de prueba creado:'));
    console.log({
      email: usuario.email,
      password: 'admin123', // Contraseña sin encriptar
      id: usuario._id
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error(colors.red('Error al crear usuario:'), error);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error(colors.red.bold(`Error al conectar a MongoDB: ${err.message}`));
  process.exit(1);
});