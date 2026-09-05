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
    if (req.user.role === 'rider' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Cannot access another rider\'s deliveries' })
    }
    const db = getDb()
    const deliveries = db.prepare('SELECT * FROM deliveries WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)

    res.json(deliveries.map(d => ({
      ...d,
      proof_of_delivery: d.proof_of_delivery ? JSON.parse(d.proof_of_delivery) : null,
      rating: db.prepare('SELECT * FROM rider_ratings WHERE delivery_id = ?').get(d.id) || null,
    })))
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch rider deliveries')
    res.status(500).json({ error: 'Failed to fetch rider deliveries' })
  }
})

// GET /api/riders/:id/rating - Get rider's rating
router.get('/:id/rating', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'rider' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Cannot access another rider\'s ratings' })
    }
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

// POST /api/riders/:id/rating - Save one customer rating for a completed delivery
router.post('/:id/rating', authenticateToken, (req, res) => {
  try {
    const { deliveryId, rating, comment = '' } = req.body
    if (req.user.role !== 'rider' || req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Only the assigned rider can submit this rating' })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer from 1 to 5' })
    }

    const db = getDb()
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(deliveryId)
    if (!delivery || delivery.rider_id !== req.params.id) {
      return res.status(404).json({ error: 'Assigned delivery not found' })
    }
    if (delivery.status !== 'DELIVERED') {
      return res.status(409).json({ error: 'A rating requires a completed delivery' })
    }
    if (db.prepare('SELECT * FROM rider_ratings WHERE delivery_id = ?').get(deliveryId)) {
      return res.status(409).json({ error: 'This delivery has already been rated' })
    }

    const ratingId = `rat-${Date.now()}`
    db.prepare(`
      INSERT INTO rider_ratings (id, rider_id, delivery_id, customer_name, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(ratingId, req.params.id, deliveryId, delivery.customer_name, rating, String(comment).trim())

    const profile = db.prepare('SELECT * FROM rider_profiles WHERE user_id = ?').get(req.params.id)
    const badges = JSON.parse(profile?.badges || '[]')
    let points = profile?.points || 0
    points += 2 + (rating === 5 ? 5 : 0)
    const fiveStarCount = db.prepare('SELECT * FROM rider_ratings WHERE rider_id = ?').all(req.params.id).filter(item => item.rating === 5).length
    if (fiveStarCount >= 3 && !badges.includes('Customer Favorite')) badges.push('Customer Favorite')
    db.prepare('UPDATE rider_profiles SET points = ?, badges = ? WHERE user_id = ?').run(points, JSON.stringify(badges), req.params.id)

    res.status(201).json({ rating: { id: ratingId, riderId: req.params.id, deliveryId, rating, comment: String(comment).trim() }, points, badges })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to save rating')
    res.status(500).json({ error: 'Failed to save rating' })
  }
})

// GET /api/riders/:id/progress - Persisted rider points and badges
router.get('/:id/progress', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'rider' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Cannot access another rider\'s progress' })
    }
    const db = getDb()
    const profile = db.prepare('SELECT * FROM rider_profiles WHERE user_id = ?').get(req.params.id)
    if (!profile) return res.status(404).json({ error: 'Rider not found' })
    const completed = db.prepare('SELECT * FROM deliveries WHERE rider_id = ?').all(req.params.id).filter(d => d.status === 'DELIVERED').length
    res.json({ riderId: req.params.id, points: profile.points || 0, completedDeliveries: completed, badges: JSON.parse(profile.badges || '[]') })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch rider progress')
    res.status(500).json({ error: 'Failed to fetch rider progress' })
  }
})

export default router
