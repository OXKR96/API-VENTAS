const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Crear una nueva venta
// src/controllers/saleController.js
exports.createSale = async (req, res) => {
  try {
    const { 
      items, 
      paymentMethod, 
      customer, 
      notes, 
      discount = 0, 
      taxes = 0 
    } = req.body;

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

    // Crear venta
    const sale = new Sale({
      user: req.user._id,
      items: processedItems,
      totalAmount,
      paymentMethod,
      customer,
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

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
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
      page = 1, 
      limit = 10, 
      startDate, 
      endDate 
    } = req.query;

    const filter = {};

    if (startDate && endDate) {
      filter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(filter)
      .sort({ saleDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(filter);

    res.json({
      success: true,
      data: sales,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSales: total
      }
    });
  } catch (error) {
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
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    // Restaurar stock de productos
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      product.stock += item.quantity;
      await product.save();
    }

    // Actualizar estado de la venta
    sale.status = 'Cancelada';
    await sale.save();

    res.json({
      success: true,
      message: 'Venta cancelada exitosamente',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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