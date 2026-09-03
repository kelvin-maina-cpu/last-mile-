import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navigation from './components/Navigation'
import Chatbot from './components/Chatbot'
import QandAButton from './components/QandAButton'
import { ToastProvider } from './context/ToastContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RetailerPage from './pages/RetailerPage'
import DispatcherPage from './pages/DispatcherPage'
import RiderDashboardPage from './pages/RiderDashboardPage'
import DeliveryDetailPage from './pages/DeliveryDetailPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
    if (!loading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
      const roleRoutes = { rider: '/rider', dispatcher: '/dispatcher', retailer: '/retailer', customer: '/rider' }
      navigate(roleRoutes[user?.role] || '/login', { replace: true })
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

function GoogleCallback() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const data = params.get('data')
    if (data) {
      try {
        const userData = JSON.parse(data)
        loginWithGoogle(userData)
        const roleRoutes = { rider: '/rider', dispatcher: '/dispatcher', retailer: '/retailer', customer: '/rider' }
        navigate(roleRoutes[userData.user?.role] || '/rider', { replace: true })
      } catch {
        navigate('/login', { replace: true })
      }
    } else {
      navigate('/login', { replace: true })
    }
  }, [loginWithGoogle, navigate])

  return (
    <div className="loading-state">
      <div className="loading-state__spinner" />
      <p>Signing in with Google...</p>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/rider" replace /> : <LoginPage />
      } />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/retailer" element={
        <ProtectedRoute allowedRoles={['retailer', 'dispatcher']}>
          <Navigation />
          <RetailerPage />
        </ProtectedRoute>
      } />
      <Route path="/dispatcher" element={
        <ProtectedRoute allowedRoles={['dispatcher', 'retailer']}>
          <Navigation />
          <DispatcherPage />
        </ProtectedRoute>
      } />
      <Route path="/rider" element={
        <ProtectedRoute allowedRoles={['rider', 'customer']}>
          <Navigation />
          <RiderDashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/deliveries/:deliveryId" element={
        <ProtectedRoute>
          <Navigation />
          <DeliveryDetailPage />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem('reflex_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])
  return null
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeInitializer />
        <div className="app">
          <AppRoutes />
          <Chatbot />
          <QandAButton />
        </div>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App