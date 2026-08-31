import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../db/database.js'
import { authenticateToken, generateToken } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/login - Email/password login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim())

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google login. Please sign in with Google.' })
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = generateToken(user.id)

    // Get rider profile if rider
    let riderProfile = null
    if (user.role === 'rider') {
      riderProfile = db.prepare('SELECT * FROM rider_profiles WHERE user_id = ?').get(user.id)
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      riderProfile,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Login failed')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' })
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim())
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync(password, salt)

    const userId = `${role}-${Date.now()}`
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, email.toLowerCase().trim(), passwordHash, name, role)

    // If rider, create rider profile
    let riderProfile = null
    if (role === 'rider') {
      const profileId = `rp-${Date.now()}`
      db.prepare(`
        INSERT INTO rider_profiles (id, user_id, phone, vehicle_type, available)
        VALUES (?, ?, ?, 'motorcycle', 1)
      `).run(profileId, userId, phone || '')
      riderProfile = db.prepare('SELECT * FROM rider_profiles WHERE id = ?').get(profileId)
    }

    const token = generateToken(userId)

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        name,
        role,
        avatar_url: null,
      },
      riderProfile,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Registration failed')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    const db = getDb()
    let riderProfile = null

    if (req.user.role === 'rider') {
      riderProfile = db.prepare('SELECT * FROM rider_profiles WHERE user_id = ?').get(req.user.id)
    }

    res.json({
      user: req.user,
      riderProfile,
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch current user')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// GET /api/auth/google - Google OAuth initiation
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
  const scope = 'openid email profile'

  if (!clientId || clientId === 'your-google-client-id') {
    // Demo mode: simulate Google OAuth with a mock user
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?demo=true&email=demo@reflex.co.ke&name=Google+User&role=rider`)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

// GET /api/auth/google/callback - Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, demo, email, name, role } = req.query
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    // Demo mode (no real Google credentials configured)
    if (demo === 'true') {
      const db = getDb()
      const demoEmail = email || 'demo@reflex.co.ke'
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(demoEmail)

      if (!user) {
        // Create a demo Google user
        const userId = `rider-${Date.now()}`
        db.prepare(`
          INSERT INTO users (id, email, name, role, google_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, demoEmail, name?.replace(/\+/g, ' ') || 'Google User', role || 'rider', 'google-demo')

        // Create rider profile
        const profileId = `rp-${Date.now()}`
        db.prepare(`
          INSERT INTO rider_profiles (id, user_id, phone, vehicle_type, available)
          VALUES (?, ?, '0700 000 000', 'motorcycle', 1)
        `).run(profileId, userId)

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      }

      const token = generateToken(user.id)
      let riderProfile = null
      if (user.role === 'rider') {
        riderProfile = db.prepare('SELECT * FROM rider_profiles WHERE user_id = ?').get(user.id)
      }

      const userData = encodeURIComponent(JSON.stringify({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url },
        riderProfile,
      }))

      return res.redirect(`${frontendUrl}/auth/google/callback?data=${userData}`)
    }

    // Real Google OAuth flow
    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=no_code`)
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_CALLBACK_URL

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()
    if (tokens.error) {
      return res.redirect(`${frontendUrl}/login?error=token_exchange_failed`)
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const googleUser = await userInfoResponse.json()
    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}/login?error=no_email`)
    }

    // Find or create user in database
    const db = getDb()
    let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleUser.id, googleUser.email)

    if (!user) {
      // Create new user from Google
      const userId = `rider-${Date.now()}`
      db.prepare(`
        INSERT INTO users (id, email, name, role, google_id, avatar_url)
        VALUES (?, ?, ?, 'rider', ?, ?)
      `).run(userId, googleUser.email, googleUser.name, googleUser.id, googleUser.picture)

      // Create rider profile
      const profileId = `rp-${Date.now()}`
      db.prepare(`
        INSERT INTO rider_profiles (id, user_id, phone, vehicle_type, available)
        VALUES (?, ?, '0700 000 000', 'motorcycle', 1)
      `).run(profileId, userId)

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    } else if (!user.google_id) {
      // Link existing email account to Google
      db.prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?').run(googleUser.id, googleUser.picture, user.id)
    }

    const token = generateToken(user.id)
    let riderProfile = null
    if (user.role === 'rider') {
      riderProfile = db.prepare('SELECT * FROM rider_profiles WHERE user_id = ?').get(user.id)
    }

    const userData = encodeURIComponent(JSON.stringify({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url },
      riderProfile,
    }))

    res.redirect(`${frontendUrl}/auth/google/callback?data=${userData}`)
  } catch (error) {
    req.log.error({ err: error }, 'Google OAuth callback failed')
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`)
  }
})

// GET /api/auth/demo-accounts - List demo accounts (development only)
router.get('/demo-accounts', (req, res) => {
  // Disable in production to prevent credential leakage
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' })
  }
  try {
    const db = getDb()
    const users = db.prepare(`
      SELECT u.id, u.email, u.name, u.role, rp.phone, rp.vehicle_type
      FROM users u
      LEFT JOIN rider_profiles rp ON u.id = rp.user_id
      WHERE u.password_hash IS NOT NULL
      ORDER BY u.role, u.id
    `).all()

    res.json({
      accounts: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        phone: u.phone,
        vehicle_type: u.vehicle_type,
      }))
    })
  } catch (error) {
    req.log.error({ err: error }, 'Failed to fetch demo accounts')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
