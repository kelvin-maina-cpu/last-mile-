class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND');
  }
}

class InvalidIdError extends AppError {
  constructor(resource) {
    super(`Invalid ${resource} ID format`, 400, 'INVALID_ID');
  }
}

class InvalidTransitionError extends AppError {
  constructor(message) {
    super(message, 400, 'INVALID_TRANSITION');
  }
}

class RiderUnavailableError extends AppError {
  constructor() {
    super('Rider is not available', 409, 'RIDER_UNAVAILABLE');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  InvalidIdError,
  InvalidTransitionError,
  RiderUnavailableError,
  DatabaseError,
};
