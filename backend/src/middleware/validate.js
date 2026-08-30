const { ValidationError } = require('../utils/errors');

// Validate delivery creation fields
function validateDeliveryCreation(req, res, next) {
  const { customerName, customerPhone, deliveryAddress, itemDescription } = req.body;
  const errors = [];

  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    errors.push('Customer name is required');
  }
  if (!customerPhone || typeof customerPhone !== 'string' || !customerPhone.trim()) {
    errors.push('Customer phone is required');
  }
  if (!deliveryAddress || typeof deliveryAddress !== 'string' || !deliveryAddress.trim()) {
    errors.push('Delivery address is required');
  }
  if (!itemDescription || typeof itemDescription !== 'string' || !itemDescription.trim()) {
    errors.push('Item description is required');
  }

  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }

  next();
}

// Validate rider assignment body
function validateAssignment(req, res, next) {
  const { riderId } = req.body;
  if (!riderId || typeof riderId !== 'string' || !riderId.trim()) {
    return next(new ValidationError('Validation failed', ['Rider ID is required']));
  }
  next();
}

// Validate status update body
function validateStatusUpdate(req, res, next) {
  const { status } = req.body;
  if (!status || typeof status !== 'string' || !status.trim()) {
    return next(new ValidationError('Validation failed', ['Status is required']));
  }
  next();
}

module.exports = {
  validateDeliveryCreation,
  validateAssignment,
  validateStatusUpdate,
};
