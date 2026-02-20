// ============================================================
// Auth Service — Server Entry Point
// ============================================================

const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4001;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const server = app.server;
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases and services
    await connectDB();
    logger.info('✅ MongoDB connected');

    await connectRedis();
    logger.info('✅ Redis connected');

    try {
      await connectRabbitMQ();
      logger.info('✅ RabbitMQ connected');
    } catch (err) {
      logger.warn('⚠️ RabbitMQ connection failed, running without message queue:', err.message);
    }

    // Start HTTP server
    app.server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Auth Service running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start Auth Service:', err);
    process.exit(1);
  }
};

startServer();
