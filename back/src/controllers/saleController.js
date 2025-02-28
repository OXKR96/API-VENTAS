const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Crear una nueva venta
// src/controllers/saleController.js
exports.createSale = async (req, res) => {
  try {
    const { 
      items, 
      paymentMethod, 
      customerId,
      notes, 
      discount = 0, 
      taxes = 0,
      saleType = 'Contado'
    } = req.body;

    console.log('Datos recibidos:', {
      saleType,
      customerId,
      paymentMethod,
      items: items?.length
    });

    // Validar y procesar items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // Buscar producto
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Producto no encontrado: ${item.product}`
        });
      }

      // Verificar stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para el producto: ${product.name}`
        });
      }

      // Calcular subtotal
      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      // Reducir stock
      product.stock -= item.quantity;
      await product.save();

      processedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal
      });
    }

    // Calcular detalles de impuestos
    const taxRate = 0.19; // IVA del 19%
    const taxAmount = totalAmount * taxRate;
    const total = totalAmount + taxAmount;

    // Si es venta a crédito, buscar y validar el cliente
    let customerData = null;
    if (saleType === 'Crédito') {
      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Las ventas a crédito requieren un cliente'
        });
      }

      // Buscar el cliente en la base de datos
      const Customer = require('../models/Customer');
      const customer = await Customer.findById(customerId);
      
      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      customerData = {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        document: customer.document
      };
    }

    console.log('Datos del cliente procesados:', customerData);

    // Crear venta
    const sale = new Sale({
      user: req.user._id,
      items: processedItems,
      totalAmount,
      saleType,
      paymentMethod,
      customer: customerData,
      notes,
      discount,
      taxes,
      status: 'Completada',
      taxDetails: {
        subtotal: totalAmount,
        taxRate,
        taxAmount,
        total
      }
    });

    // Generar número de factura después de crear la venta
    sale.invoiceNumber = sale.generateInvoiceNumber();

    // Guardar venta
    await sale.save();

    console.log('Venta creada:', {
      saleType: sale.saleType,
      customer: sale.customer,
      totalAmount: sale.totalAmount,
      invoiceNumber: sale.invoiceNumber
    });

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todas las ventas
exports.getSales = async (req, res) => {
  try {
    const { 
      search,
      startDate,
      endDate,
      saleType,
      status,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    // Búsqueda por cliente o número de factura
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtro por fechas
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Ajustar la fecha final al final del día
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    // Filtro por tipo de venta
    if (saleType) {
      query.saleType = saleType;
    }

    // Filtro por estado
    if (status) {
      query.status = status;
    }

    console.log('Query de filtrado:', query);

    const sales = await Sale.find(query)
      .sort(sort)
      .populate('user', 'name')
      .lean();

    console.log(`Total de ventas encontradas: ${sales.length}`);

    // Procesar las ventas para incluir el número de visualización
    const processedSales = sales.map((sale, index) => ({
      ...sale,
      displayNumber: sales.length - index,
      saleType: sale.saleType || 'Contado',
      status: sale.status || 'Completada',
      totalAmount: parseFloat(sale.totalAmount) || 0
    }));

    res.json({
      success: true,
      count: processedSales.length,
      data: processedSales
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener venta por ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener ventas por rango de fechas
exports.getSalesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const sales = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$saleDate" 
            } 
          },
          totalSales: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancelar venta
exports.cancelSale = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Intentando cancelar venta:', id);

    // Buscar la venta
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Verificar que la venta no esté ya cancelada
    if (sale.status === 'Cancelada') {
      return res.status(400).json({
        success: false,
        message: 'Esta venta ya está cancelada'
      });
    }

    // Revertir el stock de los productos
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        console.log(`Revirtiendo stock del producto ${product.name} en ${item.quantity} unidades`);
        product.stock += item.quantity; // Devolver la cantidad al inventario
        await product.save();
      }
    }

    // Actualizar el estado de la venta a cancelada
    sale.status = 'Cancelada';
    await sale.save();

    console.log('Venta cancelada exitosamente:', sale);

    res.json({
      success: true,
      message: 'Venta cancelada exitosamente',
      data: sale
    });
  } catch (error) {
    console.error('Error al cancelar la venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la venta: ' + error.message
    });
  }
};

// Obtener estadísticas de ventas
exports.getSalesStats = async (req, res) => {
  try {
    console.log('Usuario autenticado:', req.user);

    // Obtener estadísticas básicas
    const totalSales = await Sale.countDocuments({ status: 'Completada' });
    const totalRevenue = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      { $group: { 
        _id: null, 
        total: { $sum: '$totalAmount' } 
      }}
    ]);

    // Obtener ventas mensuales
    const monthlySales = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' }
          },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' }
                }
              }
            ]
          },
          total: 1
        }
      }
    ]);

    // Obtener productos más vendidos
    const topProducts = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Obtener conteo de productos con bajo stock
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

    // Obtener total de productos
    const totalProducts = await Product.countDocuments();

    res.json({
      success: true,
      totalProducts,
      lowStockProducts,
      totalSales,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
      customerStats: {
        totalCustomers: 0, // Esto deberá ser implementado cuando tengamos el modelo de clientes
        totalDebt: 0,
        customersByStatus: {
          AL_DIA: 0,
          EN_MORA: 0,
          BLOQUEADO: 0
        }
      },
      monthlySales,
      topProducts,
      topDebtors: [] // Esto deberá ser implementado cuando tengamos el modelo de clientes
    });
  } catch (error) {
    console.error('Error en estadísticas de ventas:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar venta
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Si la venta está cancelada, no permitir la edición
    if (sale.status === 'Cancelada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una venta cancelada'
      });
    }

    // Actualizar los campos permitidos
    if (req.body.paymentMethod) sale.paymentMethod = req.body.paymentMethod;
    if (req.body.notes) sale.notes = req.body.notes;
    if (req.body.customer) sale.customer = req.body.customer;

    await sale.save();

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};