const { AppError, ValidationError, InvalidIdError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  // Use the request-scoped logger so requestId is automatically included
  const log = req.log || require('../utils/logger');
  log.error({ err, method: req.method, path: req.path }, 'Request error');

  // If it's our custom AppError, use its properties
  if (err instanceof AppError) {
    const response = {
      error: err.message,
      code: err.code,
    };
    if (err.details && err.details.length > 0) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const resource = err.path === 'riderId' ? 'rider' : 'delivery';
    const error = new InvalidIdError(resource);
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    const error = new ValidationError('Validation failed', details);
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  // Unexpected server error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};

module.exports = errorHandler;
