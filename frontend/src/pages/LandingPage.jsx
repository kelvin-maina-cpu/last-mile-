import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

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
        <button className="landing__login-link" onClick={handleLogin}>
          LOGIN
        </button>
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
          <button className="landing__btn landing__btn--google" onClick={handleLogin}>
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
