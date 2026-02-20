// ============================================================
// Auth Service — Prometheus Metrics Middleware
// ============================================================

const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default system metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const authAttempts = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'status'],
  registers: [register],
});

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  activeConnections.inc();
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    activeConnections.dec();
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
};

// Metrics endpoint handler
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  authAttempts,
  register,
};
