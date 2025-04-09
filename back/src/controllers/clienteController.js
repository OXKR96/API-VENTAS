const Cliente = require('../models/Cliente');
const asyncHandler = require('express-async-handler');

// @desc    Obtener todos los clientes
// @route   GET /api/clientes
// @access  Private
const getClientes = asyncHandler(async (req, res) => {
  const { search = '', page = 1, limit = 10, sort = 'nombre', order = 'asc' } = req.query;
  
  // Construir el filtro de búsqueda
  const filter = {};
  if (search) {
    filter.$or = [
      { cedula: { $regex: search, $options: 'i' } },
      { nombre: { $regex: search, $options: 'i' } },
      { apellido: { $regex: search, $options: 'i' } },
      { telefono: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Calcular paginación
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Construir ordenamiento
  const sortObj = {};
  sortObj[sort] = order === 'asc' ? 1 : -1;

  // Obtener clientes y contar total
  const [clientes, total] = await Promise.all([
    Cliente.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit)),
    Cliente.countDocuments(filter)
  ]);

  res.json({
    clientes,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    total
  });
});

// @desc    Obtener un cliente por ID
// @route   GET /api/clientes/:id
// @access  Private
const getClienteById = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);
  
  if (cliente) {
    res.json(cliente);
  } else {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }
});

// @desc    Obtener un cliente por cédula
// @route   GET /api/clientes/cedula/:cedula
// @access  Private
const getClienteByCedula = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findOne({ cedula: req.params.cedula });
  
  if (cliente) {
    res.json(cliente);
  } else {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }
});

// @desc    Crear un nuevo cliente
// @route   POST /api/clientes
// @access  Private
const createCliente = asyncHandler(async (req, res) => {
  const { cedula, nombre, apellido, telefono, email, direccion, fechaNacimiento } = req.body;

  // Verificar si ya existe un cliente con esa cédula
  const clienteExistente = await Cliente.findOne({ cedula });
  
  if (clienteExistente) {
    res.status(400);
    throw new Error('Ya existe un cliente con esa cédula');
  }

  const cliente = await Cliente.create({
    cedula,
    nombre,
    apellido,
    telefono,
    email,
    direccion,
    fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined
  });

  if (cliente) {
    res.status(201).json(cliente);
  } else {
    res.status(400);
    throw new Error('Datos de cliente inválidos');
  }
});

// @desc    Actualizar un cliente
// @route   PUT /api/clientes/:id
// @access  Private
const updateCliente = asyncHandler(async (req, res) => {
  const { cedula, nombre, apellido, telefono, email, direccion, fechaNacimiento } = req.body;

  const cliente = await Cliente.findById(req.params.id);

  if (!cliente) {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }

  // Si está cambiando la cédula, verificar que no exista ya
  if (cedula && cedula !== cliente.cedula) {
    const clienteExistente = await Cliente.findOne({ cedula });
    
    if (clienteExistente) {
      res.status(400);
      throw new Error('Ya existe un cliente con esa cédula');
    }
  }

  cliente.cedula = cedula || cliente.cedula;
  cliente.nombre = nombre || cliente.nombre;
  cliente.apellido = apellido || cliente.apellido;
  cliente.telefono = telefono || cliente.telefono;
  cliente.email = email || cliente.email;
  cliente.direccion = direccion !== undefined ? direccion : cliente.direccion;
  cliente.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento) : cliente.fechaNacimiento;

  const clienteActualizado = await cliente.save();
  res.json(clienteActualizado);
});

// @desc    Eliminar un cliente
// @route   DELETE /api/clientes/:id
// @access  Private
const deleteCliente = asyncHandler(async (req, res) => {
  const cliente = await Cliente.findById(req.params.id);

  if (cliente) {
    await cliente.deleteOne();
    res.json({ message: 'Cliente eliminado' });
  } else {
    res.status(404);
    throw new Error('Cliente no encontrado');
  }
});

module.exports = {
  getClientes,
  getClienteById,
  getClienteByCedula,
  createCliente,
  updateCliente,
  deleteCliente
};