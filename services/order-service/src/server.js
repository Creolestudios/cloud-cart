// ============================================================
// Order Service — Server Entry Point
// ============================================================

const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRabbitMQ, consumeEvents } = require('./config/rabbitmq');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4003;

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (app.server) {
    app.server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 30000);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    logger.info('✅ MongoDB connected');

    try {
      await connectRabbitMQ();
      await consumeEvents();
      logger.info('✅ RabbitMQ connected & consuming events');
    } catch (err) {
      logger.warn('⚠️ RabbitMQ not available:', err.message);
    }

    app.server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Order Service running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start Order Service:', err);
    process.exit(1);
  }
};

startServer();
