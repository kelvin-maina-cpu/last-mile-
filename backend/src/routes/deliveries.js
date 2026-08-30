const express = require('express');
const router = express.Router();
const deliveryService = require('../services/deliveryService');
const {
  validateDeliveryCreation,
  validateAssignment,
  validateStatusUpdate,
} = require('../middleware/validate');

// POST /api/deliveries — Create a new delivery
router.post('/', validateDeliveryCreation, async (req, res, next) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);

    // Emit Socket.IO event after successful persistence
    const io = req.app.get('io');
    if (io) {
      io.emit('delivery:created', { delivery });
    }

    res.status(201).json({ delivery });
  } catch (error) {
    next(error);
  }
});

// GET /api/deliveries — List all deliveries
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const deliveries = await deliveryService.listDeliveries(status);
    res.json({ deliveries });
  } catch (error) {
    next(error);
  }
});

// GET /api/deliveries/:id — Get a single delivery
router.get('/:id', async (req, res, next) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    res.json({ delivery });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/deliveries/:id/assign — Assign a rider
router.patch('/:id/assign', validateAssignment, async (req, res, next) => {
  try {
    const { delivery, rider } = await deliveryService.assignRider(
      req.params.id,
      req.body.riderId
    );

    // Emit Socket.IO event after successful persistence
    const io = req.app.get('io');
    if (io) {
      io.emit('delivery:assigned', { delivery, rider });
    }

    res.json({ delivery });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/deliveries/:id/status — Update delivery status
router.patch('/:id/status', validateStatusUpdate, async (req, res, next) => {
  try {
    const delivery = await deliveryService.updateStatus(
      req.params.id,
      req.body.status
    );

    // Emit Socket.IO event after successful persistence
    const io = req.app.get('io');
    if (io) {
      io.emit('delivery:status-updated', { delivery });
    }

    res.json({ delivery });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
