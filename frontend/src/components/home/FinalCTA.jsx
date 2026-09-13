import { useNavigate } from 'react-router-dom'
import { useReveal } from './homeUtils'
import { useAuth } from '../../context/AuthContext'

const ROLE_ROUTES = { rider: '/rider', dispatcher: '/dispatcher', retailer: '/retailer', customer: '/rider' }

function FinalCTA() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [ref, visible] = useReveal()

  const handleAuth = () => {
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role] || '/login')
    } else {
      navigate('/login')
    }
  }

  return (
    <section className="home-cta" aria-labelledby="cta-title">
      {/* Decorative route lines / glowing workflow pattern */}
      <svg
        className="home-cta__bg"
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M-40 300 C 200 300, 260 120, 480 120 S 760 300, 980 300 S 1180 140, 1260 140"
          fill="none"
          stroke="url(#ctaGrad)"
          strokeWidth="2"
          strokeDasharray="8 10"
        />
        <path
          d="M-40 340 C 240 340, 300 170, 520 170 S 780 340, 1000 340 S 1200 190, 1280 190"
          fill="none"
          stroke="url(#ctaGrad)"
          strokeWidth="1.4"
          strokeDasharray="4 12"
          opacity="0.6"
        />
        <circle cx="480" cy="120" r="5" fill="#ff8a3d" />
        <circle cx="980" cy="300" r="5" fill="#7c2d9e" />
        <defs>
          <linearGradient id="ctaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7c2d9e" stopOpacity="0.15" />
            <stop offset="0.5" stopColor="#7c2d9e" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      <div
        ref={ref}
        className={`home-cta__inner reveal ${visible ? 'reveal--visible' : ''}`}
      >
        <h2 id="cta-title" className="home-title">READY TO MOVE YOUR DELIVERIES FORWARD?</h2>
        <p className="home-subcopy">
          Bring retailers, dispatchers, and riders into one seamless delivery workflow.
        </p>
        <div className="home-cta__actions">
          <button className="btn btn--primary home-cta__btn" onClick={handleAuth}>
            GET STARTED
          </button>
          <button className="btn home-cta__btn home-cta__btn--ghost" onClick={handleAuth}>
            LOGIN
          </button>
        </div>
      </div>
    </section>
  )
}

export default FinalCTA
