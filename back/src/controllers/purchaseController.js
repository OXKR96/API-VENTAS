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
      startDate, 
      endDate, 
      status,
      paymentMethod,
      search,
      page = 1,
      limit = 50
    } = req.query;

    let filter = {};

    // Filtro por fechas
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate + 'T00:00:00.000Z'),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Filtro por estado
    if (status && status !== 'Todos') {
      filter.status = status;
    }

    // Filtro por método de pago
    if (paymentMethod && paymentMethod !== 'Todos') {
      filter.paymentMethod = paymentMethod;
    }

    // Primero obtenemos las compras con populate
    const purchases = await Purchase.find(filter)
      .populate({
        path: 'supplier',
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Si hay término de búsqueda, filtramos los resultados
    let filteredPurchases = purchases;
    if (search) {
      filteredPurchases = purchases.filter(purchase => {
        const supplierName = purchase.supplier?.name?.toLowerCase() || '';
        const purchaseNumber = purchase.purchaseNumber?.toString() || '';
        const searchTerm = search.toLowerCase();
        
        return supplierName.includes(searchTerm) || purchaseNumber.includes(searchTerm);
      });
    }

    // Contamos el total después del filtrado
    const total = filteredPurchases.length;

    res.json({
      success: true,
      data: filteredPurchases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
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

    if (purchase.status === 'Cancelada') {
      return res.status(400).json({
        success: false,
        message: 'Esta compra ya está cancelada'
      });
    }

    // Revertir el stock de los productos
    for (const item of purchase.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
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
    console.error('Error al cancelar la compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la compra: ' + error.message
    });
  }
};

// Actualizar compra
exports.updatePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const purchase = await Purchase.findById(req.params.id).session(session);
    if (!purchase) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    if (purchase.status === 'Cancelada') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una compra cancelada'
      });
    }

    const { supplier, items, paymentMethod, notes } = req.body;

    // Actualizar campos básicos
    if (supplier) purchase.supplier = supplier;
    if (paymentMethod) purchase.paymentMethod = paymentMethod;
    if (notes) purchase.notes = notes;

    if (items && items.length > 0) {
      // Revertir stock anterior
      for (const oldItem of purchase.items) {
        const product = await Product.findById(oldItem.product).session(session);
        if (product) {
          product.stock -= oldItem.quantity;
          await product.save({ session });
        }
      }

      // Procesar nuevos items
      let totalAmount = 0;
      const processedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          throw new Error(`Producto no encontrado: ${item.product}`);
        }

        const subtotal = item.costPrice * item.quantity;
        totalAmount += subtotal;

        product.stock += item.quantity;
        await product.save({ session });

        processedItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          costPrice: item.costPrice,
          subtotal
        });
      }

      purchase.items = processedItems;
      purchase.totalAmount = totalAmount;
    }

    await purchase.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: purchase
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error al actualizar la compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la compra'
    });
  } finally {
    session.endSession();
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