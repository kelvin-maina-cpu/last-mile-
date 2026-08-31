import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

// Demo users for when backend auth is not available
const DEMO_USERS = {
  retailer: {
    id: 'retailer-001',
    name: 'Shop Owner',
    email: 'shop@retailer.co.ke',
    role: 'retailer',
  },
  dispatcher: {
    id: 'dispatcher-001',
    name: 'Admin Dispatcher',
    email: 'admin@reflex.co.ke',
    role: 'dispatcher',
  },
  rider: {
    id: 'rider-001',
    name: 'James Mwangi',
    email: 'james@reflex.co.ke',
    role: 'rider',
    riderProfile: {
      vehicle_type: 'Motorcycle',
      phone: '+254712345678',
    },
  },
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
    // Demo mode: bypass real auth
    // Match email to demo user
    const role = Object.keys(DEMO_USERS).find(
      (r) => DEMO_USERS[r].email === email
    )

    if (role) {
      const demoUser = DEMO_USERS[role]
      const demoToken = `demo-token-${role}-${Date.now()}`

      localStorage.setItem('reflex_token', demoToken)
      localStorage.setItem('reflex_user', JSON.stringify(demoUser))
      if (demoUser.riderProfile) {
        localStorage.setItem('reflex_rider_profile', JSON.stringify(demoUser.riderProfile))
      }

      setToken(demoToken)
      setUser(demoUser)
      setRiderProfile(demoUser.riderProfile || null)

      return { token: demoToken, user: demoUser }
    }

    // If no match, create a generic user
    const genericUser = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'rider',
    }
    const genericToken = `demo-token-${Date.now()}`

    localStorage.setItem('reflex_token', genericToken)
    localStorage.setItem('reflex_user', JSON.stringify(genericUser))

    setToken(genericToken)
    setUser(genericUser)

    return { token: genericToken, user: genericUser }
  }, [])

  const register = useCallback(async (email, password, name, role, phone) => {
    // Demo mode: same as login
    return login(email, password)
  }, [login])

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
