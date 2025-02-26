const Product = require('../models/Product');
const mongoose = require('mongoose');

// Crear nuevo producto
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    
    res.status(201).json({
      success: true,
      data: savedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todos los productos
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtro de búsqueda
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Configurar ordenamiento
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Realizar búsqueda paginada
    const products = await Product.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Contar total de productos
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar producto
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    product.stock += quantity;

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener productos con bajo stock
// src/controllers/productController.js

// Obtener productos con bajo stock
exports.getLowStockProducts = async (req, res) => {
    try {
      const lowStockProducts = await Product.find({
        $expr: { 
          $lte: ['$stock', '$minimumStock'] 
        }
      });
  
      res.json({
        success: true,
        count: lowStockProducts.length,
        data: lowStockProducts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Obtener total de productos y productos con bajo stock
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ 
      stock: { $lte: 5 } // Cambiar 5 por tu valor de stock mínimo
    });

    res.json({
      success: true,
      totalProducts,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProductCount = async (req, res) => {
  try {
    console.log('Usuario autenticado:', req.user);

    const count = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ 
      stock: { $lte: 5 } 
    });

    res.json({
      success: true,
      count,
      lowStockCount
    });
  } catch (error) {
    console.error('Error en conteo de productos:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};