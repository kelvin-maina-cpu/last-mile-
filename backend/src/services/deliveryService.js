const Delivery = require('../models/Delivery');
const Rider = require('../models/Rider');
const {
  NotFoundError,
  ValidationError,
  InvalidTransitionError,
  RiderUnavailableError,
  InvalidIdError,
} = require('../utils/errors');

const mongoose = require('mongoose');

// Validate ObjectId format before DB queries
function validateId(id, resource) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new InvalidIdError(resource);
  }
}

// State machine — centralized transition rules
const VALID_TRANSITIONS = {
  REQUESTED: ['ASSIGNED'],
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['DELIVERED'],
  DELIVERED: [],
};

function canTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed && allowed.includes(newStatus);
}

// Create a new delivery (always starts as REQUESTED)
async function createDelivery(data) {
  const delivery = await Delivery.create({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryAddress: data.deliveryAddress,
    itemDescription: data.itemDescription,
    // status defaults to REQUESTED — client cannot override
  });
  return delivery;
}

// List deliveries, optionally filtered by status
async function listDeliveries(status) {
  const filter = {};
  if (status) {
    filter.status = status;
  }
  const deliveries = await Delivery.find(filter).sort({ createdAt: -1 });
  return deliveries;
}

// Get a single delivery by ID
async function getDeliveryById(id) {
  validateId(id, 'delivery');
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw new NotFoundError('Delivery not found', 'DELIVERY_NOT_FOUND');
  }

  return delivery;
}

// Assign a rider to a delivery
async function assignRider(deliveryId, riderId) {
  validateId(deliveryId, 'delivery');
  validateId(riderId, 'rider');

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new NotFoundError('Delivery not found', 'DELIVERY_NOT_FOUND');
  }

  if (delivery.status !== 'REQUESTED') {
    throw new InvalidTransitionError(
      `Cannot assign rider: delivery status is ${delivery.status}, must be REQUESTED`
    );
  }

  const rider = await Rider.findById(riderId);
  if (!rider) {
    throw new NotFoundError('Rider not found', 'RIDER_NOT_FOUND');
  }

  if (!rider.available) {
    throw new RiderUnavailableError();
  }

  // Perform assignment
  delivery.status = 'ASSIGNED';
  delivery.riderId = rider._id;
  await delivery.save();

  // Mark rider as unavailable
  rider.available = false;
  await rider.save();

  return { delivery, rider };
}

// Update delivery status (enforce state machine)
async function updateStatus(deliveryId, newStatus) {
  validateId(deliveryId, 'delivery');

  const validStatusValues = ['PICKED_UP', 'DELIVERED'];
  if (!validStatusValues.includes(newStatus)) {
    throw new ValidationError(
      `Invalid status value. Must be one of: ${validStatusValues.join(', ')}`,
      [`Status must be one of: ${validStatusValues.join(', ')}`]
    );
  }

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new NotFoundError('Delivery not found', 'DELIVERY_NOT_FOUND');
  }

  if (!canTransition(delivery.status, newStatus)) {
    if (delivery.status === 'DELIVERED') {
      throw new InvalidTransitionError('Delivery is already delivered');
    }
    throw new InvalidTransitionError(
      `Cannot transition from ${delivery.status} to ${newStatus}`
    );
  }

  delivery.status = newStatus;
  await delivery.save();

  return delivery;
}

module.exports = {
  createDelivery,
  listDeliveries,
  getDeliveryById,
  assignRider,
  updateStatus,
  canTransition,
  VALID_TRANSITIONS,
};
