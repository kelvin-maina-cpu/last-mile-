const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Rider name is required'],
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      required: [true, 'Rider phone is required'],
      trim: true,
      maxlength: 20,
    },
    available: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for dispatcher queries (available riders)
riderSchema.index({ available: 1 });

const Rider = mongoose.model('Rider', riderSchema);

module.exports = Rider;
