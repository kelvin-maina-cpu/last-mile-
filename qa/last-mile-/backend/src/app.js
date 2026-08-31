const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const deliveryRoutes = require('./routes/deliveries');
const riderRoutes = require('./routes/riders');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/health', healthRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/riders', riderRoutes);

// --- 404 handler (for unmatched routes) ---
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// --- Centralized error handler (must be last) ---
app.use(errorHandler);

module.exports = app;
