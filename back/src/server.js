// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const colors = require('colors');
const dotenv = require('dotenv');

// Rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const sucursalRoutes = require('./routes/sucursalRoutes');
const creditoRoutes = require('./routes/creditoRoutes');
const abonoRoutes = require('./routes/abonoRoutes');
const liquidacionRoutes = require('./routes/liquidacionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

// Cargar variables de entorno
dotenv.config();

// Inicializar express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/creditos', creditoRoutes);
app.use('/api/abonos', abonoRoutes);
app.use('/api/liquidaciones', liquidacionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clientes', clienteRoutes);

// Ruta para verificar que el servidor está corriendo
app.get('/', (req, res) => {
  res.send('API está funcionando correctamente');
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(colors.red.bold(`Error: ${err.message}`));
  res.status(500).json({
    message: 'Error en el servidor',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/creditosapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log(colors.cyan.bold('MongoDB Conectado'));
})
.catch(err => {
  console.error(colors.red.bold(`Error al conectar a MongoDB: ${err.message}`));
  process.exit(1);
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(colors.yellow.bold(`Servidor corriendo en modo ${process.env.NODE_ENV || 'desarrollo'} en puerto ${PORT}`));
});