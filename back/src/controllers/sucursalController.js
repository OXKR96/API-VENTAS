// src/controllers/sucursalController.js
const Sucursal = require('../models/sucursal'); 
const Usuario = require('../models/Usuario');

// @desc    Obtener todas las sucursales
// @route   GET /api/sucursales
// @access  Private
exports.getSucursales = async (req, res) => {
  try {
    const sucursales = await Sucursal.find({}).populate('responsable', 'nombre apellido documento');
    res.json(sucursales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Crear una nueva sucursal
// @route   POST /api/sucursales
// @access  Private/Admin
exports.crearSucursal = async (req, res) => {
  try {
    const { nombreComercial, direccion, responsable, estado, saldoDisponible } = req.body;

    // Verificar si el responsable existe
    const responsableExiste = await Usuario.findById(responsable);
    if (!responsableExiste) {
      return res.status(404).json({ message: 'Usuario responsable no encontrado' });
    }

    // Verificar que el responsable sea un usuario comercial
    if (responsableExiste.tipo !== 'Comercial') {
      return res.status(400).json({ message: 'El responsable debe ser un usuario comercial' });
    }

    // Crear nueva sucursal
    const sucursal = await Sucursal.create({
      nombreComercial,
      direccion,
      responsable,
      estado: estado || 'Activo',
      saldoDisponible: saldoDisponible || 0
    });

    const sucursalPopulada = await Sucursal.findById(sucursal._id).populate('responsable', 'nombre apellido documento');

    res.status(201).json(sucursalPopulada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Obtener sucursal por ID
// @route   GET /api/sucursales/:id
// @access  Private
exports.getSucursalById = async (req, res) => {
  try {
    const sucursal = await Sucursal.findById(req.params.id).populate('responsable', 'nombre apellido documento');
    
    if (!sucursal) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    
    res.json(sucursal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Actualizar sucursal
// @route   PUT /api/sucursales/:id
// @access  Private/Admin
exports.actualizarSucursal = async (req, res) => {
  try {
    const sucursal = await Sucursal.findById(req.params.id);
    
    if (!sucursal) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    
    // Si hay cambio de responsable
    if (req.body.responsable && req.body.responsable !== sucursal.responsable.toString()) {
      // Verificar si el nuevo responsable existe
      const nuevoResponsable = await Usuario.findById(req.body.responsable);
      if (!nuevoResponsable) {
        return res.status(404).json({ message: 'Nuevo responsable no encontrado' });
      }
      
      // Verificar que sea un usuario comercial
      if (nuevoResponsable.tipo !== 'Comercial') {
        return res.status(400).json({ message: 'El responsable debe ser un usuario comercial' });
      }
    }
    
    // Actualizar campos
    sucursal.nombreComercial = req.body.nombreComercial || sucursal.nombreComercial;
    sucursal.direccion = req.body.direccion || sucursal.direccion;
    sucursal.responsable = req.body.responsable || sucursal.responsable;
    sucursal.estado = req.body.estado || sucursal.estado;
    
    // Actualizar saldo disponible si se proporciona
    if (req.body.saldoDisponible !== undefined) {
      sucursal.saldoDisponible = req.body.saldoDisponible;
    }
    
    const updatedSucursal = await sucursal.save();
    const sucursalPopulada = await Sucursal.findById(updatedSucursal._id).populate('responsable', 'nombre apellido documento');
    
    res.json(sucursalPopulada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Eliminar sucursal
// @route   DELETE /api/sucursales/:id
// @access  Private/Admin
exports.eliminarSucursal = async (req, res) => {
  try {
    const sucursal = await Sucursal.findById(req.params.id);
    
    if (!sucursal) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    
    await sucursal.remove();
    
    res.json({ message: 'Sucursal eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// @desc    Actualizar saldo de sucursal
// @route   PUT /api/sucursales/:id/saldo
// @access  Private/Admin
exports.actualizarSaldo = async (req, res) => {
  try {
    const { saldoDisponible } = req.body;
    
    if (saldoDisponible === undefined) {
      return res.status(400).json({ message: 'El saldo disponible es requerido' });
    }
    
    const sucursal = await Sucursal.findById(req.params.id);
    
    if (!sucursal) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    
    sucursal.saldoDisponible = saldoDisponible;
    await sucursal.save();
    
    res.json({ message: 'Saldo actualizado correctamente', saldoDisponible });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};