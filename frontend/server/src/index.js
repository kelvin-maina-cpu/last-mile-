import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { URL } from 'url'
import dotenv from 'dotenv'
import { initializeDatabase } from './db/database.js'
import authRoutes from './routes/auth.js'
import deliveryRoutes from './routes/deliveries.js'
import riderRoutes from './routes/riders.js'
import chatRoutes from './routes/chat.js'

dotenv.config()

const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const ADDITIONAL_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : []

// Initialize database
console.log('[Server] Initializing database...')
initializeDatabase()
console.log('[Server] Database initialized')

// Create Express app
const app = express()

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', ...ADDITIONAL_ORIGINS],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[API] ${req.method} ${req.path}`)
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

// WebSocket Server
const wss = new WebSocketServer({ server })
const connectedClients = new Map()

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const riderId = url.searchParams.get('riderId')

  if (!riderId) {
    ws.close(1008, 'riderId parameter required')
    return
  }

  console.log(`[WS] Client connected: ${riderId}`)
  connectedClients.set(riderId, ws)

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connectionChange',
    payload: { state: 'connected', riderId },
  }))

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      console.log(`[WS] Received from ${riderId}:`, message.type)

      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }))
          break
        case 'subscribe':
          // Client subscribing to delivery updates
          ws.send(JSON.stringify({
            type: 'subscribed',
            payload: { channels: message.channels || ['all'] },
          }))
          break
        default:
          // Broadcast to other connected clients if needed
          broadcastToOthers(riderId, message)
      }
    } catch (error) {
      console.error(`[WS] Message parse error from ${riderId}:`, error)
    }
  })

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${riderId}`)
    connectedClients.delete(riderId)
  })

  ws.on('error', (error) => {
    console.error(`[WS] Error for ${riderId}:`, error.message)
    connectedClients.delete(riderId)
  })
})

function broadcastToOthers(senderId, message) {
  connectedClients.forEach((client, id) => {
    if (id !== senderId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

// Broadcast delivery update to relevant clients
function broadcastDeliveryUpdate(delivery) {
  const message = JSON.stringify({
    type: 'deliveryUpdated',
    payload: delivery,
  })

  // Send to dispatcher connections
  connectedClients.forEach((client, id) => {
    if (id.startsWith('dispatcher') && client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })

  // Send to the assigned rider
  if (delivery.rider_id) {
    const riderClient = connectedClients.get(delivery.rider_id)
    if (riderClient && riderClient.readyState === WebSocket.OPEN) {
      riderClient.send(message)
    }
  }
}

// Make broadcast function available to routes
app.locals.broadcastDeliveryUpdate = broadcastDeliveryUpdate

// Start server
server.listen(PORT, () => {
  console.log(`[Server] ✅ Reflex API running on http://localhost:${PORT}`)
  console.log(`[Server] ✅ WebSocket server running on ws://localhost:${PORT}`)
  console.log(`[Server] ✅ Frontend: ${FRONTEND_URL}`)
  console.log(`[Server] 📝 Demo password for all accounts: password123`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...')
  wss.clients.forEach(client => client.close())
  server.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[Server] Shutting down...')
  wss.clients.forEach(client => client.close())
  server.close()
  process.exit(0)
})
