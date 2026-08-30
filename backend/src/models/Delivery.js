const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 200,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      maxlength: 20,
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
      maxlength: 500,
    },
    itemDescription: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: {
        values: ['REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'REQUESTED',
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for documented query requirements
deliverySchema.index({ status: 1 });
deliverySchema.index({ riderId: 1 });
deliverySchema.index({ createdAt: -1 });

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
