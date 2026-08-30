const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isDbConnected = dbState === 1;

  const response = {
    status: isDbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected',
  };

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json(response);
});

module.exports = router;
