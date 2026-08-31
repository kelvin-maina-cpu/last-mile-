import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import { initializeDatabase } from './db/database.js'
import authRoutes from './routes/auth.js'
import deliveryRoutes from './routes/deliveries.js'
import riderRoutes from './routes/riders.js'
import chatRoutes from './routes/chat.js'
import logger from './utils/logger.js'
import requestId from './middleware/requestId.js'
import httpsOnly from './middleware/httpsOnly.js'

dotenv.config()

const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const VERCEL_URL = process.env.VERCEL_URL || 'https://last-mile-m4nv.vercel.app'
const ADDITIONAL_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : []

// Initialize database
logger.info('Initializing database...')
initializeDatabase()
logger.info('Database initialized')

// Create Express app
const app = express()

// Middleware — CORS allows the deployed Vercel frontend and local dev
app.use(httpsOnly)
app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}))
app.use(cors({
  origin: [FRONTEND_URL, VERCEL_URL, 'http://localhost:5173', 'http://localhost:3000', ...ADDITIONAL_ORIGINS],
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// --- Request ID + child logger ---
app.use(requestId)

// Request logging
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    req.log.info({ method: req.method, path: req.path }, 'API request')
  }
  next()
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/deliveries', deliveryRoutes)
app.use('/api/riders', riderRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Create HTTP server
const server = createServer(app)

// Socket.IO Server (compatible with socket.io-client on the frontend)
const io = new SocketIOServer(server, {
  cors: {
    origin: [FRONTEND_URL, VERCEL_URL, 'http://localhost:5173', 'http://localhost:3000', ...ADDITIONAL_ORIGINS],
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  const socketLog = logger.child({ socketId: socket.id, transport: 'socket.io' })
  socketLog.info('Client connected')

  socket.on('disconnect', (reason) => {
    socketLog.info({ reason }, 'Client disconnected')
  })

  socket.on('error', (err) => {
    socketLog.error({ err }, 'Socket error')
  })
})

// Make io accessible to routes via req.app
app.set('io', io)

// Broadcast delivery update to all connected clients
app.locals.broadcastDeliveryUpdate = (delivery) => {
  io.emit('delivery:updated', { delivery })
}

// Start server
server.listen(PORT, () => {
  logger.info({ port: PORT, frontend: FRONTEND_URL, env: process.env.NODE_ENV || 'development' }, 'Reflex fallback server started')
})

// Graceful shutdown
function gracefulShutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received')
  io.close()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
