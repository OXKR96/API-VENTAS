// src/controllers/dashboardController.js
const Credito = require('../models/Credito');
const Abono = require('../models/Abono');
const Sucursal = require('../models/sucursal');
const Usuario = require('../models/Usuario');

// @desc    Obtener datos para el dashboard
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Datos para administrativos (global)
    let query = {};
    let sucursalQuery = {};
    
    // Si es comercial, filtrar por su sucursal
    if (req.usuario.tipo === 'Comercial') {
      query.sucursal = req.usuario.sucursal;
      sucursalQuery._id = req.usuario.sucursal;
    }
    
    // Dinero disponible (suma de saldos de todas las sucursales)
    const sucursales = await Sucursal.find(sucursalQuery);
    const dineroDisponible = sucursales.reduce((total, sucursal) => total + sucursal.saldoDisponible, 0);
    
    // Clientes financiados hoy
    const clientesHoy = await Credito.countDocuments({
      ...query,
      fechaAprobacion: { $gte: today },
      estado: 'Aprobado'
    });
    
    // Total monto hoy
    const montosHoy = await Credito.aggregate([
      {
        $match: {
          ...query,
          fechaAprobacion: { $gte: today },
          estado: 'Aprobado'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$monto' }
        }
      }
    ]);
    
    const montoHoy = montosHoy.length > 0 ? montosHoy[0].total : 0;
    
    res.json({
      dineroDisponible,
      clientesHoy,
      montoHoy
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener actividad reciente
// @route   GET /api/dashboard/actividad
// @access  Private
exports.getActividad = async (req, res) => {
  try {
    // Filtrar por fecha si se proporciona
    const { fechaInicio, fechaFin } = req.query;
    let dateQuery = {};
    
    if (fechaInicio && fechaFin) {
      dateQuery = {
        fechaAprobacion: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        }
      };
    }
    
    // Datos para administrativos (global)
    let query = {
      ...dateQuery,
      estado: 'Aprobado'
    };
    
    // Si es comercial, filtrar por su sucursal
    if (req.usuario.tipo === 'Comercial') {
      query.sucursal = req.usuario.sucursal;
    }
    
    // Obtener créditos recientes
    const actividad = await Credito.find(query)
      .populate('cliente')
      .populate('sucursal')
      .populate('comercial', 'nombre apellido')
      .sort('-fechaAprobacion')
      .limit(parseInt(req.query.limit) || 10);
    
    res.json(actividad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};