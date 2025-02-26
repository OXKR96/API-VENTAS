const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Elimina cualquier opción de transacción
    });
    
    console.log(`MongoDB conectado`);
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;