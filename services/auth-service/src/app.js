// ============================================================
// Auth Service — Express Application
// ============================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const logger = require('./utils/logger');

const app = express();

// ── Security Middleware ───────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Body Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Logging ───────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ── Metrics ───────────────────────────────────────────────
app.use(metricsMiddleware);

// ── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ── Readiness Check ───────────────────────────────────────
app.get('/ready', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});

// ── Metrics Endpoint ──────────────────────────────────────
app.get('/metrics', metricsEndpoint);

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes);
// Also mount at root for gateway proxying
app.use('/', authRoutes);

// ── Error Handling ────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
