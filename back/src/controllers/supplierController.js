const Supplier = require('../models/Supplier');

// Crear nuevo proveedor
exports.createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    const savedSupplier = await supplier.save();
    
    res.status(201).json({
      success: true,
      data: savedSupplier
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todos los proveedores
exports.getAllSuppliers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      isActive
    } = req.query;

    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const suppliers = await Supplier.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Supplier.countDocuments(filter);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSuppliers: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener proveedor por ID
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar proveedor
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Eliminar proveedor (soft delete)
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id, 
      { isActive: false }, 
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Proveedor desactivado exitosamente',
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};