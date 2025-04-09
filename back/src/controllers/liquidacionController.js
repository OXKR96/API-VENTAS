// src/controllers/liquidacionController.js
const Liquidacion = require('../models/liquidacion');
const Sucursal = require('../models/sucursal');
const Credito = require('../models/Credito');   
const Abono = require('../models/Abono');

// @desc    Calcular liquidación para una sucursal
// @route   POST /api/liquidaciones/calcular
// @access  Private/Admin
exports.calcularLiquidacion = async (req, res) => {
  try {
    const { sucursal } = req.body;
    
    if (!sucursal) {
      return res.status(400).json({ message: 'ID de sucursal requerido' });
    }
    
    // Verificar que la sucursal existe
    const sucursalExiste = await Sucursal.findById(sucursal);
    if (!sucursalExiste) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    
    // Calcular total de créditos para liquidar
    const creditos = await Credito.find({
      sucursal,
      estado: 'Aprobado',
      fechaAprobacion: { $exists: true }
    });

 // Obtener el total de créditos emitidos
 const totalCreditos = await Credito.aggregate([
    {
      $match: {
        sucursal: sucursalExiste._id,
        estado: 'Aprobado',
        fechaAprobacion: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$monto' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Obtener total de abonos realizados en otras sucursales
  const abonosExternos = await Abono.aggregate([
    {
      $match: {
        sucursal: { $ne: sucursalExiste._id },
        comercial: { $exists: true }
      }
    },
    {
      $lookup: {
        from: 'creditos',
        localField: 'credito',
        foreignField: '_id',
        as: 'creditoInfo'
      }
    },
    {
      $unwind: '$creditoInfo'
    },
    {
      $match: {
        'creditoInfo.sucursal': sucursalExiste._id
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$monto' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Calcular montos
  const montoCreditos = totalCreditos.length > 0 ? totalCreditos[0].total : 0;
  const montoAbonos = abonosExternos.length > 0 ? abonosExternos[0].total : 0;
  const numeroOperaciones = totalCreditos.length > 0 ? totalCreditos[0].count : 0;
  
  // Calcular montos para liquidación
  const montoDisponible = sucursalExiste.saldoDisponible;
  const comisionPorcentaje = 0.05; // 5% de comisión
  const comision = montoDisponible * comisionPorcentaje;
  const iva = comision * 0.19; // 19% de IVA sobre la comisión
  const montoLiquidado = montoDisponible - comision - iva;
  
  res.json({
    montoDisponible,
    comision,
    iva,
    montoLiquidado,
    operaciones: numeroOperaciones,
    sucursal: sucursalExiste
  });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Error en el servidor', error: error.message });
}
};

// @desc    Crear liquidación
// @route   POST /api/liquidaciones
// @access  Private/Admin
exports.crearLiquidacion = async (req, res) => {
try {
  const { 
    sucursal, 
    montoDisponible, 
    comision, 
    iva, 
    montoLiquidado, 
    operaciones,
    cuentaReceptora,
    banco
  } = req.body;
  
  // Verificar datos requeridos
  if (!sucursal || !montoDisponible || !comision || !iva || !montoLiquidado || !operaciones) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  
  // Verificar que la sucursal existe
  const sucursalExiste = await Sucursal.findById(sucursal);
  if (!sucursalExiste) {
    return res.status(404).json({ message: 'Sucursal no encontrada' });
  }
  
  // Crear liquidación
  const liquidacion = await Liquidacion.create({
    sucursal,
    montoDisponible,
    comision,
    iva,
    montoLiquidado,
    operaciones,
    solicitadoPor: req.usuario._id,
    cuentaReceptora,
    banco
  });
  
  // Actualizar saldo de la sucursal a cero después de liquidar
  sucursalExiste.saldoDisponible = 0;
  await sucursalExiste.save();
  
  const liquidacionPopulada = await Liquidacion.findById(liquidacion._id)
    .populate('sucursal')
    .populate('solicitadoPor', 'nombre apellido');
  
  res.status(201).json(liquidacionPopulada);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Error en el servidor', error: error.message });
}
};

// @desc    Obtener liquidaciones
// @route   GET /api/liquidaciones
// @access  Private/Admin
exports.getLiquidaciones = async (req, res) => {
try {
  const liquidaciones = await Liquidacion.find({})
    .populate('sucursal')
    .populate('solicitadoPor', 'nombre apellido')
    .sort('-fechaLiquidacion');
  
  res.json(liquidaciones);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Error en el servidor', error: error.message });
}
};

// @desc    Actualizar estado de liquidación
// @route   PUT /api/liquidaciones/:id
// @access  Private/Admin
exports.actualizarLiquidacion = async (req, res) => {
try {
  const { estado } = req.body;
  
  if (!estado) {
    return res.status(400).json({ message: 'Estado es requerido' });
  }
  
  const liquidacion = await Liquidacion.findById(req.params.id);
  
  if (!liquidacion) {
    return res.status(404).json({ message: 'Liquidación no encontrada' });
  }
  
  liquidacion.estado = estado;
  
  const updatedLiquidacion = await liquidacion.save();
  
  const liquidacionPopulada = await Liquidacion.findById(updatedLiquidacion._id)
    .populate('sucursal')
    .populate('solicitadoPor', 'nombre apellido');
  
  res.json(liquidacionPopulada);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Error en el servidor', error: error.message });
}
};