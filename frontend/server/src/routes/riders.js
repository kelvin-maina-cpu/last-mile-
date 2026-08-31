import { Router } from 'express'
import { getDb } from '../db/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// GET /api/riders - Get all riders (for dispatcher assignment)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb()
    const riders = db.prepare(`
      SELECT u.id, u.name, u.email, rp.phone, rp.vehicle_type, rp.license_plate, rp.available
      FROM users u
      JOIN rider_profiles rp ON u.id = rp.user_id
      WHERE u.role = 'rider'
      ORDER BY u.name
    `).all()

    res.json(riders.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      available: r.available === 1,
      vehicle_type: r.vehicle_type,
      license_plate: r.license_plate,
    })))
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch riders')
    res.status(500).json({ error: 'Failed to fetch riders' })
  }
})

// GET /api/riders/:id - Get rider profile
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDb()
    const rider = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, rp.phone, rp.vehicle_type, rp.license_plate, rp.available
      FROM users u
      JOIN rider_profiles rp ON u.id = rp.user_id
      WHERE u.id = ? AND u.role = 'rider'
    `).get(req.params.id)

    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' })
    }

    res.json({
      id: rider.id,
      name: rider.name,
      email: rider.email,
      role: rider.role,
      phone: rider.phone,
      vehicle_type: rider.vehicle_type,
      license_plate: rider.license_plate,
      available: rider.available === 1,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch rider')
    res.status(500).json({ error: 'Failed to fetch rider' })
  }
})

// GET /api/riders/:id/deliveries - Get rider's deliveries
router.get('/:id/deliveries', authenticateToken, (req, res) => {
  try {
    const db = getDb()
    const deliveries = db.prepare('SELECT * FROM deliveries WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)

    res.json(deliveries.map(d => ({
      ...d,
      proof_of_delivery: d.proof_of_delivery ? JSON.parse(d.proof_of_delivery) : null,
    })))
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch rider deliveries')
    res.status(500).json({ error: 'Failed to fetch rider deliveries' })
  }
})

// GET /api/riders/:id/rating - Get rider's rating
router.get('/:id/rating', authenticateToken, (req, res) => {
  try {
    const db = getDb()

    // Get overall rating
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_ratings,
        ROUND(AVG(rating), 1) as average_rating
      FROM rider_ratings
      WHERE rider_id = ?
    `).get(req.params.id)

    // Get rating breakdown
    const breakdown = db.prepare(`
      SELECT rating, COUNT(*) as count
      FROM rider_ratings
      WHERE rider_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `).all(req.params.id)

    // Get recent ratings
    const recent = db.prepare(`
      SELECT id, customer_name, rating, comment, created_at
      FROM rider_ratings
      WHERE rider_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.params.id)

    const breakdownMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const b of breakdown) {
      breakdownMap[b.rating] = b.count
    }

    res.json({
      riderId: req.params.id,
      averageRating: stats.average_rating || 0,
      totalRatings: stats.total_ratings || 0,
      breakdown: breakdownMap,
      recentRatings: recent,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch rider rating')
    res.status(500).json({ error: 'Failed to fetch rider rating' })
  }
})

export default router
