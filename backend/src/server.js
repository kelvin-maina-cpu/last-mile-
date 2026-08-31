require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// --- CORS origins for Socket.IO ---
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : [];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

// Initialize Socket.IO with restricted CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : [],
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
  await connectDB();
  server.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Reflex backend started');
  });
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
