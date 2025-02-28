const Supplier = require('../models/Supplier');

// Crear nuevo proveedor
exports.createSupplier = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    
    const supplier = new Supplier({
      name: req.body.name,
      contactName: req.body.contactName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      taxId: req.body.taxId,
      paymentTerms: req.body.paymentTerms || 'Contado',
      isActive: true
    });

    const savedSupplier = await supplier.save();
    console.log('Proveedor creado:', savedSupplier);
    
    res.status(201).json({
      success: true,
      data: savedSupplier
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todos los proveedores
exports.getAllSuppliers = async (req, res) => {
  try {
    console.log('Recibiendo solicitud de proveedores');
    console.log('Query params:', req.query);

    const { 
      search = '',
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filter = {};
    
    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { taxId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    console.log('Filtros aplicados:', JSON.stringify(filter, null, 2));

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const suppliers = await Supplier.find(filter)
      .sort(sortConfig)
      .lean();

    console.log(`Número de proveedores encontrados: ${suppliers.length}`);

    res.json({
      success: true,
      data: suppliers,
      total: suppliers.length,
      filters: {
        search,
        isActive,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los proveedores',
      error: error.message
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
    console.log('Actualizando proveedor:', req.params.id);
    console.log('Datos de actualización:', req.body);

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        contactName: req.body.contactName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        taxId: req.body.taxId,
        paymentTerms: req.body.paymentTerms
      },
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    console.log('Proveedor actualizado:', updatedSupplier);

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el proveedor: ' + error.message
    });
  }
};

// Cambiar estado del proveedor (activar/desactivar)
exports.toggleSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log(`Cambiando estado del proveedor ${id} a ${isActive ? 'activo' : 'inactivo'}`);

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    console.log(`Estado del proveedor actualizado: ${updatedSupplier.name} - ${isActive ? 'Activado' : 'Desactivado'}`);

    res.json({
      success: true,
      message: isActive 
        ? 'Proveedor activado exitosamente'
        : 'Proveedor desactivado exitosamente',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error al cambiar estado del proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del proveedor: ' + error.message
    });
  }
};

// Mantener deleteSupplier por compatibilidad pero redirigir a toggleSupplierStatus
exports.deleteSupplier = async (req, res) => {
  try {
    console.log('Redirigiendo eliminación a desactivación:', req.params.id);
    
    // Llamar a toggleSupplierStatus con isActive = false
    req.body.isActive = false;
    return await exports.toggleSupplierStatus(req, res);
  } catch (error) {
    console.error('Error al desactivar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar el proveedor: ' + error.message
    });
  }
};