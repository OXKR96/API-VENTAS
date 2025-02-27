const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

exports.getSalesStats = async (req, res) => {
  try {
    // Obtener ventas totales y ticket promedio
    const salesAggregate = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          averageTicket: { $avg: '$totalAmount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    // Obtener ventas mensuales
    const monthlySales = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Obtener productos más vendidos
    const topProducts = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Obtener ventas por día de la semana
    const salesByDayOfWeek = await Sale.aggregate([
      { $match: { status: 'Completada' } },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSales: salesAggregate[0]?.totalSales || 0,
        averageTicket: salesAggregate[0]?.averageTicket || 0,
        totalTransactions: salesAggregate[0]?.totalTransactions || 0,
        monthlySales: monthlySales.map(sale => ({
          month: `${sale._id.year}-${String(sale._id.month).padStart(2, '0')}`,
          total: sale.total,
          count: sale.count
        })),
        topProducts: topProducts.map(product => ({
          name: product.name,
          quantity: product.quantity,
          total: product.total
        })),
        salesByDayOfWeek: salesByDayOfWeek.map(day => ({
          day: day._id,
          total: day.total,
          count: day.count
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de ventas',
      error: error.message
    });
  }
};

exports.getDebtStats = async (req, res) => {
  try {
    // Obtener total de clientes y estadísticas de deuda
    const customerStats = await Customer.aggregate([
      {
        $facet: {
          'totalCustomers': [{ $count: 'count' }],
          'byStatus': [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalDebt: { $sum: '$totalDebt' }
              }
            }
          ],
          'debtRanges': [
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$totalDebt', 0] }, then: 'Sin deuda' },
                      { case: { $lte: ['$totalDebt', 1000] }, then: '0-1000' },
                      { case: { $lte: ['$totalDebt', 5000] }, then: '1001-5000' },
                      { case: { $lte: ['$totalDebt', 10000] }, then: '5001-10000' }
                    ],
                    default: 'Más de 10000'
                  }
                },
                count: { $sum: 1 },
                totalDebt: { $sum: '$totalDebt' }
              }
            }
          ]
        }
      }
    ]);

    // Obtener top deudores
    const topDebtors = await Customer.find({ totalDebt: { $gt: 0 } })
      .select('name document totalDebt status lastPaymentDate')
      .sort('-totalDebt')
      .limit(5);

    const customersByStatus = {
      AL_DIA: 0,
      EN_MORA: 0,
      BLOQUEADO: 0
    };

    let totalDebt = 0;

    customerStats[0].byStatus.forEach(stat => {
      if (stat._id) {
        customersByStatus[stat._id] = stat.count;
        totalDebt += stat.totalDebt || 0;
      }
    });

    res.json({
      success: true,
      data: {
        totalCustomers: customerStats[0].totalCustomers[0]?.count || 0,
        totalDebt,
        customersByStatus,
        debtRanges: customerStats[0].debtRanges,
        topDebtors: topDebtors.map(debtor => ({
          name: debtor.name,
          document: debtor.document,
          debt: debtor.totalDebt,
          status: debtor.status,
          lastPayment: debtor.lastPaymentDate
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de deuda',
      error: error.message
    });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    // Obtener estadísticas generales del inventario
    const inventoryStats = await Product.aggregate([
      {
        $facet: {
          'totalProducts': [{ $count: 'count' }],
          'byCategory': [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } }
              }
            }
          ],
          'stockStatus': [
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$stock', 0] }, then: 'Sin Stock' },
                      { case: { $lte: ['$stock', '$minStock'] }, then: 'Bajo Stock' },
                      { case: { $lte: ['$stock', { $multiply: ['$minStock', 2] }] }, then: 'Stock Moderado' }
                    ],
                    default: 'Stock Suficiente'
                  }
                },
                count: { $sum: 1 },
                products: { $push: { name: '$name', stock: '$stock', minStock: '$minStock' } }
              }
            }
          ],
          'totalValue': [
            {
              $group: {
                _id: null,
                value: { $sum: { $multiply: ['$stock', '$costPrice'] } }
              }
            }
          ]
        }
      }
    ]);

    // Obtener productos con stock crítico (en 0 o por debajo del mínimo)
    const lowStock = await Product.find({
      $or: [
        { stock: 0 },
        {
          $expr: {
            $lte: ['$stock', '$minStock']
          }
        }
      ]
    })
    .select('name stock minStock category costPrice sellingPrice')
    .sort('stock');

    const stats = inventoryStats[0];
    
    res.json({
      success: true,
      data: {
        totalProducts: stats.totalProducts[0]?.count || 0,
        totalValue: stats.totalValue[0]?.value || 0,
        categoryStats: stats.byCategory,
        stockStatus: stats.stockStatus,
        lowStock: lowStock.map(product => ({
          name: product.name,
          stock: product.stock,
          minStock: product.minStock,
          category: product.category,
          value: product.stock * product.costPrice,
          status: product.stock === 0 ? 'Sin Stock' : 'Bajo Stock'
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de inventario',
      error: error.message
    });
  }
}; 