// ============================================================
// Order Service — Database Configuration
// ============================================================

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cloudcart_orders';
  
  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection failed:', err);
    throw err;
  }
};

module.exports = { connectDB };
