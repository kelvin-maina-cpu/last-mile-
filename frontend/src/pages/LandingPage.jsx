import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/apiConfig'

function LandingPage() {
  const navigate = useNavigate()
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('reflex_theme') === 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark')
    localStorage.setItem('reflex_theme', isLight ? 'light' : 'dark')
  }, [isLight])

  const handleLogin = () => {
    navigate('/login')
  }

  const handleGetStarted = () => {
    navigate('/login')
  }

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing__header">
        <div className="landing__brand">
          <span className="landing__logo-icon">&#9889;</span>
          <span className="landing__logo-text">REFLEX</span>
        </div>
        <div className="landing__header-right">
          <button
            className="theme-toggle"
            onClick={() => setIsLight(!isLight)}
            aria-label="Toggle light/dark mode"
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? '🌙' : '☀️'}
          </button>
          <button className="landing__login-link" onClick={handleLogin}>
            LOGIN
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing__hero">
        <h1 className="landing__title">REFLEX</h1>
        <p className="landing__tagline">
          From request to delivery, with you till the last mile.
        </p>

        <div className="landing__actions">
          <button className="landing__btn landing__btn--primary" onClick={handleGetStarted}>
            GET STARTED
          </button>
          <button className="landing__btn landing__btn--secondary" onClick={handleLogin}>
            LOGIN
          </button>
          <button className="landing__btn landing__btn--google" onClick={() => {
            // Fallback to localhost:3001 only for local dev; production uses VITE_API_URL
            const apiUrl = API_BASE_URL || 'http://localhost:3001/api'
            window.location.href = `${apiUrl}/auth/google`
          }}>
            <span className="landing__google-icon">G</span>
            CONTINUE WITH GOOGLE
          </button>
        </div>

        <p className="landing__subtitle">
          ONE PLATFORM FOR RETAILERS, DISPATCHERS, AND RIDERS.
        </p>
      </main>

      {/* Footer */}
      <footer className="landing__footer">
        <p className="landing__copyright">
          &copy; 2026 REFLEX. PRECISION LOGISTICS.
        </p>
        <div className="landing__links">
          <a href="#terms" className="landing__link">TERMS</a>
          <span className="landing__link-divider">|</span>
          <a href="#privacy" className="landing__link">PRIVACY</a>
          <span className="landing__link-divider">|</span>
          <a href="#contact" className="landing__link">CONTACT</a>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
