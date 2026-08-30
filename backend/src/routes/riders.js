const express = require('express');
const router = express.Router();
const riderService = require('../services/riderService');

// GET /api/riders — List all riders
router.get('/', async (req, res, next) => {
  try {
    const { available } = req.query;
    const riders = await riderService.listRiders(available);
    res.json({ riders });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
