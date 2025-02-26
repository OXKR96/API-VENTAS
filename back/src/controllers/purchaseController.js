const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

// Crear una nueva compra
exports.createPurchase = async (req, res) => {
  try {
    const { 
      supplier, 
      items, 
      paymentMethod, 
      notes 
    } = req.body;

    // Validar proveedor
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: `Proveedor no encontrado: ${supplier}`
      });
    }

    // Procesar items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // Buscar producto
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.product}`);
      }

      // Calcular subtotal
      const subtotal = item.costPrice * item.quantity;
      totalAmount += subtotal;

      // Actualizar stock
      product.stock += item.quantity;
      product.costPrice = item.costPrice; // Actualizar precio de costo
      await product.save();

      processedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        costPrice: item.costPrice,
        subtotal
      });
    }

    // Crear compra
    const purchase = new Purchase({
      supplier,
      user: req.user._id,
      items: processedItems,
      totalAmount,
      paymentMethod,
      notes,
      status: 'Completada'
    });

    // Guardar compra
    await purchase.save();

    res.status(201).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Error en creación de compra:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener lista de compras
exports.getPurchases = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      supplier, 
      status 
    } = req.query;

    const filter = {};

    if (startDate && endDate) {
      filter.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (supplier) {
      filter.supplier = supplier;
    }

    if (status) {
      filter.status = status;
    }

    const purchases = await Purchase.find(filter)
      .populate('supplier', 'name')
      .populate('user', 'name')
      .sort({ purchaseDate: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(filter);

    res.json({
      success: true,
      data: purchases,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPurchases: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener compra por ID
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name')
      .populate('user', 'name')
      .populate('items.product', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancelar compra
exports.cancelPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Verificar si la compra ya está cancelada
    if (purchase.status === 'Cancelada') {
      return res.status(400).json({
        success: false,
        message: 'La compra ya está cancelada'
      });
    }

    // Restaurar stock de productos
    for (const item of purchase.items) {
      const product = await Product.findById(item.product);
      
      // Revertir el aumento de stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Actualizar estado de la compra
    purchase.status = 'Cancelada';
    await purchase.save();

    res.json({
      success: true,
      message: 'Compra cancelada exitosamente',
      data: purchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reporte de compras
exports.getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren fechas de inicio y fin'
      });
    }

    const purchases = await Purchase.aggregate([
      {
        $match: {
          purchaseDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'Completada'
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$purchaseDate" 
            } 
          },
          totalPurchases: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};