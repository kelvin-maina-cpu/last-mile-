import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, HAS_PRIMARY_BACKEND, USE_MOCK_AUTH } from '../config/apiConfig'

const AuthContext = createContext(null)

// ============================================================
// MOCK USERS — used when USE_MOCK_AUTH=true or no server available
// ============================================================
const MOCK_USERS = [
  // Match the demo emails used in LoginPage.jsx
  {
    email: 'shop@retailer.co.ke',
    password: 'password123',
    user: { id: 'retailer-001', name: 'Mama Njeri Shop', email: 'shop@retailer.co.ke', role: 'retailer' },
    token: 'mock-retailer-token',
  },
  {
    email: 'admin@reflex.co.ke',
    password: 'password123',
    user: { id: 'dispatcher-001', name: 'Sarah Dispatcher', email: 'admin@reflex.co.ke', role: 'dispatcher' },
    token: 'mock-dispatcher-token',
  },
  {
    email: 'james@reflex.co.ke',
    password: 'password123',
    user: { id: 'rider-001', name: 'James Mwangi', email: 'james@reflex.co.ke', role: 'rider' },
    token: 'mock-rider-token',
    riderProfile: { id: 'rider-001', name: 'James Mwangi', phone: '0712 345 678', available: true },
  },
  // Quick-select shortcuts: role as email (any password works)
  {
    email: 'dispatcher',
    password: 'password123',
    user: { id: 'dispatcher-001', name: 'Sarah Dispatcher', email: 'admin@reflex.co.ke', role: 'dispatcher' },
    token: 'mock-dispatcher-token',
  },
  {
    email: 'rider',
    password: 'password123',
    user: { id: 'rider-001', name: 'James Mwangi', email: 'james@reflex.co.ke', role: 'rider' },
    token: 'mock-rider-token',
    riderProfile: { id: 'rider-001', name: 'James Mwangi', phone: '0712 345 678', available: true },
  },
  {
    email: 'retailer',
    password: 'password123',
    user: { id: 'retailer-001', name: 'Mama Njeri Shop', email: 'shop@retailer.co.ke', role: 'retailer' },
    token: 'mock-retailer-token',
  },
]

function mockLogin(email, password) {
  const match = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!match) {
    throw new Error('Invalid email or password (mock mode)')
  }
  return {
    token: match.token,
    user: match.user,
    riderProfile: match.riderProfile || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [riderProfile, setRiderProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mockMode, setMockMode] = useState(USE_MOCK_AUTH)

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('reflex_token')
    const savedUser = localStorage.getItem('reflex_user')
    const savedProfile = localStorage.getItem('reflex_rider_profile')
    const savedMockMode = localStorage.getItem('reflex_mock_mode') === 'true'

    if (savedMockMode) {
      setMockMode(true)
    }

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        if (savedProfile) {
          setRiderProfile(JSON.parse(savedProfile))
        }
      } catch {
        localStorage.removeItem('reflex_token')
        localStorage.removeItem('reflex_user')
        localStorage.removeItem('reflex_rider_profile')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    // Explicit mock auth mode
    if (mockMode) {
      console.log('[Auth] Using mock authentication')
      const data = mockLogin(email, password)
      localStorage.setItem('reflex_token', data.token)
      localStorage.setItem('reflex_user', JSON.stringify(data.user))
      localStorage.setItem('reflex_mock_mode', 'true')
      if (data.riderProfile) {
        localStorage.setItem('reflex_rider_profile', JSON.stringify(data.riderProfile))
      }
      setToken(data.token)
      setUser(data.user)
      setRiderProfile(data.riderProfile || null)
      return data
    }

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }))
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()

      localStorage.setItem('reflex_token', data.token)
      localStorage.setItem('reflex_user', JSON.stringify(data.user))
      if (data.riderProfile) {
        localStorage.setItem('reflex_rider_profile', JSON.stringify(data.riderProfile))
      }

      setToken(data.token)
      setUser(data.user)
      setRiderProfile(data.riderProfile || null)

      return data
    } catch (err) {
      // If primary backend is unreachable, fall back to mock auth
      console.warn('[Auth] Server unavailable, falling back to mock auth:', err.message)
      setMockMode(true)
      localStorage.setItem('reflex_mock_mode', 'true')

      const data = mockLogin(email, password)
      localStorage.setItem('reflex_token', data.token)
      localStorage.setItem('reflex_user', JSON.stringify(data.user))
      if (data.riderProfile) {
        localStorage.setItem('reflex_rider_profile', JSON.stringify(data.riderProfile))
      }

      setToken(data.token)
      setUser(data.user)
      setRiderProfile(data.riderProfile || null)
      return data
    }
  }, [mockMode])

  const register = useCallback(async (email, password, name, role, phone) => {
    // Explicit mock auth mode
    if (mockMode) {
      console.log('[Auth] Using mock registration')
      const mockUser = {
        id: `mock-${role}-001`,
        name,
        email,
        role,
      }
      const mockToken = `mock-${role}-token`

      localStorage.setItem('reflex_token', mockToken)
      localStorage.setItem('reflex_user', JSON.stringify(mockUser))
      localStorage.setItem('reflex_mock_mode', 'true')

      setToken(mockToken)
      setUser(mockUser)
      setRiderProfile(null)

      return { token: mockToken, user: mockUser }
    }

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, phone }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }))
        throw new Error(error.error || 'Registration failed')
      }

      const data = await response.json()

      localStorage.setItem('reflex_token', data.token)
      localStorage.setItem('reflex_user', JSON.stringify(data.user))
      if (data.riderProfile) {
        localStorage.setItem('reflex_rider_profile', JSON.stringify(data.riderProfile))
      }

      setToken(data.token)
      setUser(data.user)
      setRiderProfile(data.riderProfile || null)

      return data
    } catch (err) {
      // Fall back to mock registration
      console.warn('[Auth] Server unavailable, falling back to mock registration:', err.message)
      setMockMode(true)
      localStorage.setItem('reflex_mock_mode', 'true')

      const mockUser = {
        id: `mock-${role}-001`,
        name,
        email,
        role,
      }
      const mockToken = `mock-${role}-token`

      localStorage.setItem('reflex_token', mockToken)
      localStorage.setItem('reflex_user', JSON.stringify(mockUser))

      setToken(mockToken)
      setUser(mockUser)
      setRiderProfile(null)

      return { token: mockToken, user: mockUser }
    }
  }, [mockMode])

  const loginWithGoogle = useCallback(async (userData) => {
    localStorage.setItem('reflex_token', userData.token)
    localStorage.setItem('reflex_user', JSON.stringify(userData.user))
    if (userData.riderProfile) {
      localStorage.setItem('reflex_rider_profile', JSON.stringify(userData.riderProfile))
    }

    setToken(userData.token)
    setUser(userData.user)
    setRiderProfile(userData.riderProfile || null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('reflex_token')
    localStorage.removeItem('reflex_user')
    localStorage.removeItem('reflex_rider_profile')
    localStorage.removeItem('reflex_mock_mode')
    setToken(null)
    setUser(null)
    setRiderProfile(null)
    setMockMode(USE_MOCK_AUTH)
  }, [])

  const value = {
    user,
    riderProfile,
    token,
    loading,
    mockMode,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
      return
    }
    if (!loading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
      const roleRoutes = {
        rider: '/rider',
        dispatcher: '/dispatcher',
        retailer: '/retailer',
        customer: '/rider',
      }
      navigate(roleRoutes[user?.role] || '/login')
    }
  }, [loading, isAuthenticated, user, navigate, allowedRoles])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-state__spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return children
}
