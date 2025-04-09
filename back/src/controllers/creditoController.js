// src/controllers/creditoController.js
const Credito = require('../models/Credito');
const Cliente = require('../models/Cliente');
const Sucursal = require('../models/sucursal');
const crypto = require('crypto');

// @desc    Simular un crédito
// @route   POST /api/creditos/simular
// @access  Public
exports.simularCredito = async (req, res) => {
  try {
    const { monto, plazo } = req.body;
    
    if (!monto || !plazo) {
      return res.status(400).json({ message: 'Ingrese monto y plazo' });
    }
    
    // Lógica de simulación (simplificada)
    const tasaInteres = 0.025; // 2.5% mensual
    const seguroVida = monto * 0.005; // 0.5% del monto
    
    const tasaEfectiva = Math.pow(1 + tasaInteres, plazo) - 1;
    const valorCuota = (monto * (tasaInteres * Math.pow(1 + tasaInteres, plazo))) / (Math.pow(1 + tasaInteres, plazo) - 1);
    
    const costoTotal = valorCuota * plazo;
    const intereses = costoTotal - monto;
    
    res.json({
      monto,
      plazo,
      valorCuota: Math.round(valorCuota),
      intereses: Math.round(intereses),
      seguroVida: Math.round(seguroVida),
      costoTotal: Math.round(costoTotal + seguroVida)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Solicitar validación de cliente (simula proceso con Metamap)
// @route   POST /api/creditos/validar-cliente
// @access  Private
exports.validarCliente = async (req, res) => {
  try {
    const { cedula, telefono } = req.body;
    
    if (!cedula || !telefono) {
      return res.status(400).json({ message: 'Ingrese cédula y teléfono' });
    }
    
    // Simular proceso de validación con Metamap
    // En un caso real, aquí se llamaría a la API de Metamap
    
    // Simular un 80% de aprobación
    const aprobado = Math.random() < 0.8;
    
    if (aprobado) {
      // Generar código de verificación
      const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
      
      res.json({
        aprobado: true,
        mensaje: 'Cliente validado correctamente',
        codigoVerificacion
      });
    } else {
      res.json({
        aprobado: false,
        mensaje: 'Cliente no ha pasado la validación de identidad'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Crear un nuevo crédito
// @route   POST /api/creditos
// @access  Private
exports.crearCredito = async (req, res) => {
  try {
    const { 
      clienteData, 
      monto, 
      plazo, 
      valorCuota,
      codigoVerificacion
    } = req.body;
    
    // Verificar datos requeridos
    if (!clienteData || !monto || !plazo || !valorCuota || !codigoVerificacion) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    // Obtener o crear cliente
    let cliente = await Cliente.findOne({ cedula: clienteData.cedula });
    
    if (!cliente) {
      cliente = await Cliente.create({
        cedula: clienteData.cedula,
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        telefono: clienteData.telefono,
        email: clienteData.email,
        direccion: clienteData.direccion
      });
    }
    
    // Generar código de entrega
    const codigoEntrega = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Crear crédito
    const credito = await Credito.create({
      cliente: cliente._id,
      sucursal: req.usuario.sucursal,
      comercial: req.usuario._id,
      monto,
      plazo,
      valorCuota,
      codigoVerificacion,
      codigoEntrega,
      estado: 'Aprobado',
      fechaAprobacion: Date.now()
    });
    
    // Actualizar saldo disponible de la sucursal
    const sucursal = await Sucursal.findById(req.usuario.sucursal);
    sucursal.saldoDisponible += parseFloat(monto);
    await sucursal.save();
    
    const creditoPopulado = await Credito.findById(credito._id)
      .populate('cliente')
      .populate('sucursal')
      .populate('comercial', 'nombre apellido');
    
    res.status(201).json(creditoPopulado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener créditos
// @route   GET /api/creditos
// @access  Private
exports.getCreditos = async (req, res) => {
  try {
    let query = {};
    
    // Si es comercial, filtrar por su sucursal
    if (req.usuario.tipo === 'Comercial') {
      query.sucursal = req.usuario.sucursal;
    }
    
    const creditos = await Credito.find(query)
      .populate('cliente')
      .populate('sucursal')
      .populate('comercial', 'nombre apellido')
      .sort('-fechaCreacion');
    
    res.json(creditos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};