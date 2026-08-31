import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IS_DEMO_MODE } from '../context/AuthContext'

const ROLES = [
  {
    id: 'retailer',
    label: 'Retailer',
    description: 'Create and manage delivery requests for your customers',
    icon: '📦',
    route: '/retailer',
    demoEmail: 'shop@retailer.co.ke',
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    description: 'Assign riders and track all deliveries in your area',
    icon: '🗺️',
    route: '/dispatcher',
    demoEmail: 'admin@reflex.co.ke',
  },
  {
    id: 'rider',
    label: 'Rider',
    description: 'View your assignments and update delivery status',
    icon: '🏍️',
    route: '/rider',
    demoEmail: 'james@reflex.co.ke',
  },
]

function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes = {
        rider: '/rider',
        dispatcher: '/dispatcher',
        retailer: '/retailer',
        customer: '/rider',
      }
      navigate(roleRoutes[user.role] || '/login')
    }
  }, [isAuthenticated, user, navigate])

  // Check for Google OAuth callback data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const data = params.get('data')
    if (data) {
      try {
        const userData = JSON.parse(decodeURIComponent(data))
        loginWithGoogle(userData)
      } catch {
        console.error('Failed to parse OAuth callback data')
      }
    }
  }, [loginWithGoogle])

  const handleContinue = async () => {
    if (!selectedRole) return
    const role = ROLES.find((r) => r.id === selectedRole)
    if (!role) return

    setError('')
    setLoading(true)

    try {
      await login(role.demoEmail, 'password123')
      navigate(role.route)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (IS_DEMO_MODE) {
      // Mock Google login — use a demo user
      const mockData = {
        token: 'mock-jwt-token-for-demo',
        user: { id: 'user-google', email: 'user@gmail.com', name: 'Google User', role: 'dispatcher' },
      }
      loginWithGoogle(mockData)
      navigate('/dispatcher')
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    window.location.href = `${apiUrl}/auth/google`
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__icon">&#9889;</span>
          <h1 className="login-card__title">REFLEX</h1>
          <p className="login-card__subtitle">Select your role to continue</p>
        </div>

        {error && (
          <div className="error-banner error-banner--compact" role="alert">
            <span className="error-banner__icon">!</span>
            <span className="error-banner__message">{error}</span>
          </div>
        )}

        <div className="role-list">
          {ROLES.map((role) => (
            <label
              key={role.id}
              className={`role-option ${selectedRole === role.id ? 'role-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={selectedRole === role.id}
                onChange={() => setSelectedRole(role.id)}
                className="role-option__radio"
              />
              <span className="role-option__icon">{role.icon}</span>
              <div className="role-option__info">
                <span className="role-option__label">{role.label}</span>
                <span className="role-option__desc">{role.description}</span>
              </div>
            </label>
          ))}
        </div>

        <button
          className="btn btn--primary btn--block login-card__btn"
          disabled={!selectedRole || loading}
          onClick={handleContinue}
        >
          {loading ? (
            <span className="btn__loading">
              <span className="btn__spinner" />
              Signing in...
            </span>
          ) : (
            `Continue as ${selectedRole ? ROLES.find((r) => r.id === selectedRole)?.label : '...'}`
          )}
        </button>

        <button
          className="btn btn--google btn--block login-card__google"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span className="landing__google-icon">G</span>
          Continue with Google
        </button>

        <button
          className="login-card__back"
          onClick={() => navigate('/')}
        >
          &larr; Back to home
        </button>
      </div>
    </div>
  )
}

export default LoginPage
