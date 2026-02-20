// ============================================================
// Auth Service — Database Configuration (MongoDB)
// ============================================================

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cloudcart_auth';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;
  } catch (err) {
    logger.error('MongoDB connection failed:', err);
    throw err;
  }
};

module.exports = { connectDB };
