const Rider = require('../models/Rider');

// List riders, optionally filtered by availability or authenticated user ID
async function listRiders(available, userId) {
  const filter = {};
  if (available !== undefined) {
    filter.available = available === 'true';
  }
  if (userId) {
    filter.userId = userId;
  }
  const riders = await Rider.find(filter).sort({ createdAt: -1 });
  return riders;
}

module.exports = {
  listRiders,
};
