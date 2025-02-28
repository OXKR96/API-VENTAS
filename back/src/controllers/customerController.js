const Customer = require('../models/Customer');

// @desc    Obtener todos los clientes
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res) => {
  try {
    const { 
      search = '', 
      status,
      minDebt,
      maxDebt,
      minCreditLimit,
      maxCreditLimit,
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { document: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Filtros de deuda
    if (minDebt || maxDebt) {
      filter.currentDebt = {};
      if (minDebt) filter.currentDebt.$gte = parseFloat(minDebt);
      if (maxDebt) filter.currentDebt.$lte = parseFloat(maxDebt);
    }

    // Filtros de límite de crédito
    if (minCreditLimit || maxCreditLimit) {
      filter.creditLimit = {};
      if (minCreditLimit) filter.creditLimit.$gte = parseFloat(minCreditLimit);
      if (maxCreditLimit) filter.creditLimit.$lte = parseFloat(maxCreditLimit);
    }

    console.log('Filtros de búsqueda de clientes:', filter);

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const customers = await Customer.find(filter)
      .select('name document email phone address creditLimit currentDebt status paymentHistory')
      .sort(sort);

    console.log(`Clientes encontrados: ${customers.length}`);

    res.json({
      success: true,
      data: customers,
      total: customers.length,
      filters: {
        search,
        status,
        minDebt,
        maxDebt,
        minCreditLimit,
        maxCreditLimit,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los clientes',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo cliente
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);

    const customer = new Customer({
      name: req.body.name,
      document: req.body.document,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      creditLimit: req.body.creditLimit || 0,
      currentDebt: 0,
      status: 'AL_DIA'
    });

    const savedCustomer = await customer.save();
    console.log('Cliente creado:', savedCustomer);

    res.status(201).json({
      success: true,
      data: savedCustomer
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear el cliente',
      error: error.message
    });
  }
};

// @desc    Obtener un cliente por ID
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el cliente',
      error: error.message
    });
  }
};

// @desc    Actualizar un cliente
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    console.log('Actualizando cliente:', req.params.id, req.body);

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        document: req.body.document,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        creditLimit: req.body.creditLimit
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Actualizar estado basado en la deuda actual
    customer.updateStatus();
    await customer.save();

    console.log('Cliente actualizado:', customer);

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el cliente',
      error: error.message
    });
  }
};

// @desc    Eliminar un cliente
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el cliente',
      error: error.message
    });
  }
};

// @desc    Registrar un pago o cargo
// @route   POST /api/customers/:id/payments
// @access  Private
exports.registerPayment = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const { amount, type, description } = req.body;
    
    // Actualizar la deuda actual según el tipo de transacción
    if (type === 'PAGO') {
      customer.currentDebt -= amount;
    } else if (type === 'CARGO') {
      customer.currentDebt += amount;
    }

    // Agregar la transacción al historial
    customer.paymentHistory.push({
      amount,
      type,
      description,
      date: new Date()
    });

    // Actualizar el estado del cliente
    customer.updateStatus();

    await customer.save();

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al registrar la transacción',
      error: error.message
    });
  }
};

// @desc    Obtener historial de pagos
// @route   GET /api/customers/:id/payments
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: customer.paymentHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de pagos',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de clientes
// @route   GET /api/customers/stats
// @access  Private
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const customersInDebt = await Customer.countDocuments({ currentDebt: { $gt: 0 } });
    const blockedCustomers = await Customer.countDocuments({ status: 'BLOQUEADO' });
    const totalDebt = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$currentDebt' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        customersInDebt,
        blockedCustomers,
        totalDebt: totalDebt[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
}; 