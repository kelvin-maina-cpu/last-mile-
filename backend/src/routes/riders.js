const express = require('express');
const router = express.Router();
const riderService = require('../services/riderService');
const RiderRating = require('../models/RiderRating');

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

// GET /api/riders/:id/rating — Get rider's rating
router.get('/:id/rating', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Aggregate stats for this rider
    const stats = await RiderRating.aggregate([
      { $match: { riderId: id } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    // Get breakdown by star value
    const breakdownRaw = await RiderRating.aggregate([
      { $match: { riderId: id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const b of breakdownRaw) {
      breakdown[b._id] = b.count;
    }

    // Get recent ratings
    const recentRatings = await RiderRating.find({ riderId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('customerName rating comment createdAt')
      .lean();

    const result = stats[0] || { totalRatings: 0, averageRating: 0 };

    res.json({
      riderId: id,
      averageRating: Math.round(result.averageRating * 10) / 10 || 0,
      totalRatings: result.totalRatings || 0,
      breakdown,
      recentRatings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
