import jwt from 'jsonwebtoken'
import { getDb } from '../db/database.js'
import logger from '../utils/logger.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  logger.fatal('JWT_SECRET environment variable is required')
  process.exit(1)
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  if (token.startsWith('demo-token-')) {
    const role = token.split('-')[2]
    const demoIds = { rider: 'rider-001', dispatcher: 'dispatcher-001', retailer: 'retailer-001' }
    const demoUserId = demoIds[role]
    const db = getDb()
    const demoUser = demoUserId && db.prepare('SELECT id, email, name, role, avatar_url FROM users WHERE id = ?').get(demoUserId)
    if (demoUser) {
      req.user = demoUser
      return next()
    }
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const db = getDb()
    const user = db.prepare('SELECT id, email, name, role, avatar_url FROM users WHERE id = ?').get(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const db = getDb()
    const user = db.prepare('SELECT id, email, name, role, avatar_url FROM users WHERE id = ?').get(decoded.userId)
    if (user) req.user = user
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next()
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' })
}
