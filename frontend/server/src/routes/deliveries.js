import { Router } from 'express'
import { getDb } from '../db/database.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/deliveries - Get all deliveries (dispatcher/admin)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb()
    const deliveries = db.prepare('SELECT * FROM deliveries ORDER BY created_at DESC').all()

    // Parse proof_of_delivery JSON
    const parsed = deliveries.map(d => ({
      ...d,
      proof_of_delivery: d.proof_of_delivery ? JSON.parse(d.proof_of_delivery) : null,
    }))

    res.json(parsed)
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch deliveries')
    res.status(500).json({ error: 'Failed to fetch deliveries' })
  }
})

// GET /api/deliveries/:id - Get single delivery
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDb()
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    res.json({
      ...delivery,
      proof_of_delivery: delivery.proof_of_delivery ? JSON.parse(delivery.proof_of_delivery) : null,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch delivery')
    res.status(500).json({ error: 'Failed to fetch delivery' })
  }
})

// POST /api/deliveries - Create new delivery (retailer)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { customerName, customerPhone, address, itemDescription } = req.body

    if (!customerName || !customerPhone || !address || !itemDescription) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const db = getDb()
    const id = `DEL-${Date.now()}`
    const customerId = `CUST-${customerPhone.replace(/\D/g, '').slice(-4)}`

    db.prepare(`
      INSERT INTO deliveries (id, customer_name, customer_phone, customer_id, address, item_description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, customerName, customerPhone, customerId, address, itemDescription, 'OPEN')

    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id)

    res.status(201).json({
      ...delivery,
      proof_of_delivery: null,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to create delivery')
    res.status(500).json({ error: 'Failed to create delivery' })
  }
})

// PATCH /api/deliveries/:id/status - Update delivery status
router.patch('/:id/status', authenticateToken, (req, res) => {
  // Only riders and dispatchers can update delivery status
  if (!['rider', 'dispatcher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions to update delivery status' })
  }
  try {
    const { status } = req.body
    const validStatuses = ['OPEN', 'ASSIGNED', 'PICKED_UP', 'DELIVERED']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const db = getDb()
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    db.prepare('UPDATE deliveries SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id)

    const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    res.json({
      ...updated,
      proof_of_delivery: updated.proof_of_delivery ? JSON.parse(updated.proof_of_delivery) : null,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to update delivery status')
    res.status(500).json({ error: 'Failed to update delivery status' })
  }
})

// POST /api/deliveries/:id/assign - Assign rider to delivery
router.post('/:id/assign', authenticateToken, (req, res) => {
  // Only dispatchers can assign riders
  if (req.user.role !== 'dispatcher') {
    return res.status(403).json({ error: 'Only dispatchers can assign riders' })
  }
  try {
    const { riderId } = req.body

    if (!riderId) {
      return res.status(400).json({ error: 'Rider ID is required' })
    }

    const db = getDb()
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    const rider = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(riderId, 'rider')
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' })
    }

    db.prepare('UPDATE deliveries SET rider_id = ?, status = "ASSIGNED", updated_at = datetime("now") WHERE id = ?').run(riderId, req.params.id)

    const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    res.json({
      ...updated,
      proof_of_delivery: updated.proof_of_delivery ? JSON.parse(updated.proof_of_delivery) : null,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to assign rider')
    res.status(500).json({ error: 'Failed to assign rider' })
  }
})

// POST /api/deliveries/:id/complete - Complete delivery with POD
router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const { customerId, photo, deliveredBy, timestamp } = req.body

    const db = getDb()
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    const proofOfDelivery = JSON.stringify({
      customerIdVerified: true,
      customerId,
      photo,
      deliveredBy,
      timestamp: timestamp || new Date().toISOString(),
    })

    db.prepare('UPDATE deliveries SET status = "DELIVERED", proof_of_delivery = ?, updated_at = datetime("now") WHERE id = ?').run(proofOfDelivery, req.params.id)

    const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    res.json({
      ...updated,
      proof_of_delivery: JSON.parse(updated.proof_of_delivery),
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to complete delivery')
    res.status(500).json({ error: 'Failed to complete delivery' })
  }
})

export default router

// DELETE /api/deliveries/:id - Delete a delivery
router.delete('/:id', authenticateToken, (req, res) => {
  // Only dispatchers can delete deliveries
  if (req.user.role !== 'dispatcher') {
    return res.status(403).json({ error: 'Only dispatchers can delete deliveries' })
  }
  try {
    const db = getDb()
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' })
    }

    db.prepare('DELETE FROM deliveries WHERE id = ?').run(req.params.id)

    res.json({ message: 'Delivery deleted successfully' })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to delete delivery')
    res.status(500).json({ error: 'Failed to delete delivery' })
  }
})
