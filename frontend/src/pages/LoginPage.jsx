import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/apiConfig'
import GoogleIcon from '../components/GoogleIcon'
import { deliveryService } from '../services/api/deliveryService'

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
  const { login, loginAsRider, loginWithGoogle, isAuthenticated, user } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [riders, setRiders] = useState([])
  const [ridersLoading, setRidersLoading] = useState(false)
  const [ridersError, setRidersError] = useState('')
  const [selectedRiderId, setSelectedRiderId] = useState(null)

  // Rider role picks from the actual seeded riders instead of always
  // logging in as one hardcoded demo rider.
  useEffect(() => {
    if (selectedRole !== 'rider' || riders.length > 0) return

    let cancelled = false
    setRidersLoading(true)
    setRidersError('')
    deliveryService.getRiders()
      .then((data) => {
        if (cancelled) return
        setRiders(data)
      })
      .catch(() => {
        if (!cancelled) setRidersError('Could not load riders. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setRidersLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedRole, riders.length])

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
    const oauthError = params.get('oauth_error')

    if (oauthError) {
      const messages = {
        google_not_configured: 'Google sign-in is not configured yet.',
        google_auth_denied: 'Google sign-in was cancelled or denied.',
        google_missing_code: 'Google sign-in response was incomplete.',
        google_callback_failed: 'Google sign-in failed. Please try again.',
      }
      setError(messages[oauthError] || 'Google sign-in failed. Please try again.')
    }

    if (data) {
      try {
        const userData = JSON.parse(data)
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
      if (role.id === 'rider') {
        const rider = riders.find((r) => (r._id || r.id) === selectedRiderId)
        if (!rider) {
          setError('Select a rider to continue as.')
          setLoading(false)
          return
        }
        loginAsRider(rider)
      } else {
        await login(role.demoEmail, 'password123')
      }
      navigate(role.route)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const apiUrl = API_BASE_URL || '/api'
    const role = selectedRole || 'rider'
    window.location.href = `${apiUrl}/auth/google?role=${encodeURIComponent(role)}`
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
                onChange={() => {
                  setSelectedRole(role.id)
                  setSelectedRiderId(null)
                  setError('')
                }}
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

        {selectedRole === 'rider' && (
          <div className="role-list rider-picker">
            {ridersLoading && (
              <div className="loading-state loading-state--compact">
                <div className="loading-state__spinner" />
                <p>Loading riders...</p>
              </div>
            )}

            {ridersError && (
              <div className="error-banner error-banner--compact" role="alert">
                <span className="error-banner__message">{ridersError}</span>
              </div>
            )}

            {!ridersLoading && !ridersError && riders.map((rider) => {
              const riderId = rider._id || rider.id
              return (
                <label
                  key={riderId}
                  className={`role-option ${selectedRiderId === riderId ? 'role-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="rider"
                    value={riderId}
                    checked={selectedRiderId === riderId}
                    onChange={() => {
                      setSelectedRiderId(riderId)
                      setError('')
                    }}
                    className="role-option__radio"
                  />
                  <span className="role-option__icon">🏍️</span>
                  <div className="role-option__info">
                    <span className="role-option__label">{rider.name}</span>
                    <span className="role-option__desc">
                      {rider.available ? 'Available' : 'Busy'} · {rider.phone}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        )}

        <button
          className="btn btn--primary btn--block login-card__btn"
          disabled={!selectedRole || loading || (selectedRole === 'rider' && !selectedRiderId)}
          onClick={handleContinue}
        >
          {loading ? (
            <span className="btn__loading">
              <span className="btn__spinner" />
              Signing in...
            </span>
          ) : selectedRole === 'rider' ? (
            selectedRiderId
              ? `Continue as ${riders.find((r) => (r._id || r.id) === selectedRiderId)?.name}`
              : 'Select a rider'
          ) : (
            `Continue as ${selectedRole ? ROLES.find((r) => r.id === selectedRole)?.label : '...'}`
          )}
        </button>

        <button
          className="btn btn--google btn--block login-card__google"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <GoogleIcon />
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
