const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const riderService = require('../services/riderService');
const RiderRating = require('../models/RiderRating');

// GET /api/riders — List all riders
router.get('/', async (req, res, next) => {
  try {
    const { available, userId } = req.query;
    const riders = await riderService.listRiders(available, userId);
    res.json({ riders });
  } catch (error) {
    next(error);
  }
});

// GET /api/riders/:id/rating — Get rider's rating
router.get('/:id/rating', async (req, res, next) => {
  try {
    const { id } = req.params;

    // If the ID is not a valid ObjectId, return empty rating data
    // (Google OAuth users don't have a MongoDB rider document)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        riderId: id,
        averageRating: 0,
        totalRatings: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentRatings: [],
      });
    }

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

// POST /api/riders/:id/rating - Save a rating for a completed delivery
router.post('/:id/rating', async (req, res, next) => {
  try {
    const { deliveryId, rating, comment = '' } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(deliveryId)) {
      return res.status(400).json({ error: 'Invalid rider or delivery ID' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer from 1 to 5' });
    }
    const Delivery = require('../models/Delivery');
    const delivery = await Delivery.findOne({ _id: deliveryId, riderId: req.params.id, status: 'DELIVERED' });
    if (!delivery) return res.status(404).json({ error: 'Completed delivery not found' });
    const existing = await RiderRating.findOne({ deliveryId });
    if (existing) return res.status(409).json({ error: 'This delivery has already been rated' });
    const saved = await RiderRating.create({
      riderId: req.params.id,
      deliveryId,
      customerName: delivery.customerName,
      rating,
      comment: String(comment).trim(),
    });
    const rider = await require('../models/Rider').findById(req.params.id);
    rider.points += 2 + (rating === 5 ? 5 : 0);
    const fiveStars = await RiderRating.countDocuments({ riderId: req.params.id, rating: 5 });
    if (fiveStars >= 3 && !rider.badges.includes('Customer Favorite')) rider.badges.push('Customer Favorite');
    await rider.save();
    res.status(201).json({ rating: saved, points: rider.points, badges: rider.badges });
  } catch (error) {
    next(error);
  }
});

// GET /api/riders/:id/progress - Persisted rider progress
router.get('/:id/progress', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid rider ID' });
    const Rider = require('../models/Rider');
    const Delivery = require('../models/Delivery');
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });
    const completedDeliveries = await Delivery.countDocuments({ riderId: rider._id, status: 'DELIVERED' });
    res.json({ riderId: rider._id, points: rider.points, completedDeliveries, badges: rider.badges });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
