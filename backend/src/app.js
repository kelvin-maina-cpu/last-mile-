const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('./middleware/requestId');
const logger = require('./utils/logger');
const httpsOnly = require('./middleware/httpsOnly');
const { buildAllowedOrigins } = require('./config/origins');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const deliveryRoutes = require('./routes/deliveries');
const riderRoutes = require('./routes/riders');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Render/other platforms terminate TLS at a proxy; trust forwarded protocol.
app.set('trust proxy', 1);

// --- Security Middleware ---
app.use(httpsOnly);
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMITED' },
}));

// --- CORS ---
const allowedOrigins = buildAllowedOrigins();
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// --- Body parsing with size limit ---
app.use(express.json({ limit: '1mb' }));

// --- Request ID + child logger ---
app.use(requestId);

// --- Request logging ---
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    req.log.info({ method: req.method, path: req.path }, 'API request');
  }
  next();
});

// --- Routes ---
app.use('/api/auth', authRoutes);
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
