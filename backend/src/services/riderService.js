const Rider = require('../models/Rider');

// List riders, optionally filtered by availability
async function listRiders(available) {
  const filter = {};
  if (available !== undefined) {
    filter.available = available === 'true';
  }
  const riders = await Rider.find(filter).sort({ createdAt: -1 });
  return riders;
}

module.exports = {
  listRiders,
};
