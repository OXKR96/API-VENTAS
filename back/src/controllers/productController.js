const Product = require('../models/Product');
const mongoose = require('mongoose');

// Crear nuevo producto
exports.createProduct = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      costPrice: req.body.costPrice,
      stock: req.body.stock,
      category: req.body.category,
      barcode: req.body.barcode,
      imageUrl: req.body.imageUrl,
      brand: req.body.brand,
      supplier: req.body.supplier,
      minimumStock: req.body.minimumStock,
      taxes: req.body.taxes,
      isActive: true
    });

    const savedProduct = await product.save();
    console.log('Producto creado:', savedProduct);

    res.status(201).json({
      success: true,
      data: savedProduct
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
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
      search = '', 
      category,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      supplier,
      brand,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive
    } = req.query;

    const filter = {};
    
    // Solo aplicar filtro de isActive si se proporciona
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (supplier) {
      filter.supplier = supplier;
    }

    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }

    // Filtros de precio
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Filtros de stock
    if (minStock || maxStock) {
      filter.stock = {};
      if (minStock) filter.stock.$gte = parseInt(minStock);
      if (maxStock) filter.stock.$lte = parseInt(maxStock);
    }

    console.log('Filtros de búsqueda de productos:', filter);

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(filter)
      .populate('supplier', 'name')
      .sort(sort);

    console.log(`Productos encontrados: ${products.length}`);

    res.json({
      success: true,
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
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
    console.log('Actualizando producto:', req.params.id, req.body);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        costPrice: req.body.costPrice,
        stock: req.body.stock,
        category: req.body.category,
        barcode: req.body.barcode,
        imageUrl: req.body.imageUrl,
        brand: req.body.brand,
        supplier: req.body.supplier,
        minimumStock: req.body.minimumStock,
        taxes: req.body.taxes
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    console.log('Producto actualizado:', product);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
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