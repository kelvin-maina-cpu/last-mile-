require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { buildAllowedOrigins } = require('./config/origins');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const allowedOrigins = buildAllowedOrigins();
const normalizedAllowedOrigins = new Set(
  allowedOrigins
    .filter((origin) => typeof origin === 'string' && origin.trim())
    .map((origin) => origin.replace(/\/+$/, ''))
);

// Create HTTP server from Express app
const server = http.createServer(app);

// --- CORS origins for Socket.IO ---
// Initialize Socket.IO with restricted CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Non-browser clients may not send an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (normalizedAllowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error('Socket origin not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Socket.IO connection handling — connection-scoped logger
io.on('connection', (socket) => {
  const socketLog = logger.child({ socketId: socket.id, transport: 'websocket' });
  socketLog.info('Client connected');

  socket.on('disconnect', () => {
    socketLog.info('Client disconnected');
  });

  socket.on('error', (err) => {
    socketLog.error({ err }, 'Socket error');
  });
});

// Make `io` accessible to routes/services via req.app
app.set('io', io);

// Start server
const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, '0.0.0.0', () => {
      logger.info({
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        allowedOrigins: Array.from(normalizedAllowedOrigins),
      }, 'Reflex backend started');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start backend');
    process.exit(1);
  }
};

// --- Graceful Shutdown ---
function gracefulShutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received');
  io.close();
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false).then(() => {
      logger.info('Server and database connection closed');
      process.exit(0);
    });
  });
  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();
