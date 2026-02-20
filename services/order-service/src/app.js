// ============================================================
// Order Service — Express Application
// ============================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const orderRoutes = require('./routes/order.routes');
const logger = require('./utils/logger');

const app = express();

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// Metrics
app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) throw new Error('DB not connected');
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});

app.get('/metrics', metricsEndpoint);

// Routes
app.use('/api/orders', orderRoutes);
app.use('/', orderRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
