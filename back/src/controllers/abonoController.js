// src/controllers/abonoController.js
const Abono = require('../models/Abono');
const Credito = require('../models/Credito');
const Sucursal = require('../models/sucursal');

// @desc    Registrar abono a crédito
// @route   POST /api/abonos
// @access  Private
exports.registrarAbono = async (req, res) => {
  try {
    const { credito, monto } = req.body;
    
    // Verificar datos requeridos
    if (!credito || !monto) {
      return res.status(400).json({ message: 'Credito y monto son requeridos' });
    }
    
    // Verificar que el crédito existe
    const creditoExiste = await Credito.findById(credito)
      .populate('cliente')
      .populate('sucursal');
    
    if (!creditoExiste) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }
    
    // Crear abono
    const abono = await Abono.create({
      credito,
      monto,
      sucursal: req.usuario.sucursal,
      comercial: req.usuario._id
    });
    
    // Si el comercial es de la misma sucursal que otorgó el crédito, no afecta su saldo
    // Si es de otra sucursal, el abono se resta de su saldo disponible
    if (req.usuario.sucursal.toString() !== creditoExiste.sucursal._id.toString()) {
      const sucursal = await Sucursal.findById(req.usuario.sucursal);
      sucursal.saldoDisponible -= parseFloat(monto);
      await sucursal.save();
    }
    
    const abonoPopulado = await Abono.findById(abono._id)
      .populate({
        path: 'credito',
        populate: {
          path: 'cliente'
        }
      })
      .populate('sucursal')
      .populate('comercial', 'nombre apellido');
    
    res.status(201).json(abonoPopulado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener abonos
// @route   GET /api/abonos
// @access  Private
exports.getAbonos = async (req, res) => {
  try {
    let query = {};
    
    // Si es comercial, filtrar por su sucursal
    if (req.usuario.tipo === 'Comercial') {
      query.sucursal = req.usuario.sucursal;
    }
    
    const abonos = await Abono.find(query)
      .populate({
        path: 'credito',
        populate: {
          path: 'cliente'
        }
      })
      .populate('sucursal')
      .populate('comercial', 'nombre apellido')
      .sort('-fechaAbono');
    
    res.json(abonos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};