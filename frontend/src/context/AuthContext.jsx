import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, API_BASE_URL, HAS_PRIMARY_BACKEND, USE_MOCK_AUTH } from '../config/apiConfig'

const AuthContext = createContext(null)

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
    // If mock auth is explicitly enabled, bypass the real backend
    if (USE_MOCK_AUTH) {
      console.log('[Auth] Using mock authentication (VITE_USE_MOCK_AUTH=true)')
      throw new Error('Mock auth is not configured. Set up a real backend or configure mock data.')
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
      // If primary backend is unreachable and no fallback auth exists,
      // report the failure clearly — do NOT silently log in
      if (!HAS_PRIMARY_BACKEND) {
        console.error('[Auth] No primary backend configured and fallback has no auth endpoint')
        throw new Error('Authentication service is unavailable. Please try again later.')
      }
      throw err
    }
  }, [])

  const register = useCallback(async (email, password, name, role, phone) => {
    if (USE_MOCK_AUTH) {
      console.log('[Auth] Using mock authentication (VITE_USE_MOCK_AUTH=true)')
      throw new Error('Mock auth is not configured. Set up a real backend or configure mock data.')
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
      if (!HAS_PRIMARY_BACKEND) {
        console.error('[Auth] No primary backend configured and fallback has no auth endpoint')
        throw new Error('Registration service is unavailable. Please try again later.')
      }
      throw err
    }
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
