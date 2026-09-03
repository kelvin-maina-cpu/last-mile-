const mongoose = require('mongoose');

const riderRatingSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      required: [true, 'Rider ID is required'],
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rider rating queries
riderRatingSchema.index({ riderId: 1 });
riderRatingSchema.index({ riderId: 1, createdAt: -1 });

const RiderRating = mongoose.model('RiderRating', riderRatingSchema);

module.exports = RiderRating;
