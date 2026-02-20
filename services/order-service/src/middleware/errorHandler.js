// Order Service — Error Handler
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path });

  if (err.name === 'ValidationError') {
    return res.status(422).json({ error: 'Validation Error', message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Bad Request', message: `Invalid ${err.path}` });
  }

  res.status(err.statusCode || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Not Found', message: `${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFoundHandler };
