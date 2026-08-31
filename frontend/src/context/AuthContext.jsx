import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// Mock users for demo mode
const MOCK_USERS = [
  { id: 'user-001', email: 'shop@retailer.co.ke', name: 'Retailer User', role: 'retailer' },
  { id: 'user-002', email: 'admin@reflex.co.ke', name: 'Dispatcher User', role: 'dispatcher' },
  { id: 'rider-001', email: 'james@reflex.co.ke', name: 'James Mwangi', role: 'rider' },
  { id: 'user-004', email: 'customer@test.co.ke', name: 'Test Customer', role: 'customer' },
]
const MOCK_TOKEN = 'mock-jwt-token-for-demo'

function mockLogin(email, password) {
  const user = MOCK_USERS.find((u) => u.email === email)
  if (!user) throw new Error('No account found with that email')
  const riderProfile = user.role === 'rider' ? { id: user.id, name: user.name, vehicle_type: 'Motorcycle', phone: '0712 345 678' } : null
  return { token: MOCK_TOKEN, user, riderProfile }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [riderProfile, setRiderProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('reflex_token')
    const savedUser = localStorage.getItem('reflex_user')
    const savedProfile = localStorage.getItem('reflex_rider_profile')

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
    // Explicit mock mode: always use mock auth without contacting backend
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
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

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
      // Auto-fallback: if backend is unreachable (network error), fall back to mock auth
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('[Auth] Backend unreachable — falling back to mock auth. Start the backend or set VITE_USE_MOCK_AUTH=true.')
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
      throw err
    }
  }, [])

  const register = useCallback(async (email, password, name, role, phone) => {
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      const newUser = { id: 'user-' + Date.now(), email, name, role }
      MOCK_USERS.push(newUser)
      const riderProfile = role === 'rider' ? { id: 'rider-' + Date.now(), name, vehicle_type: 'Motorcycle', phone } : null
      const data = { token: MOCK_TOKEN, user: newUser, riderProfile }
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

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
  }, [])

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
    setToken(null)
    setUser(null)
    setRiderProfile(null)
  }, [])

  const value = {
    user,
    riderProfile,
    token,
    loading,
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
      // Redirect to appropriate dashboard based on role
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
