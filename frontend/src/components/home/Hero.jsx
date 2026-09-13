import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { scrollToSection } from './homeUtils'
import StatusBadge from '../delivery/StatusBadge'
import { BoltIcon, BoxIcon, CheckIcon, ArrowRightIcon } from './Icons'

const STATUS_FLOW = ['REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED']

// Mirrors the app's real status flow (REQUESTED → ASSIGNED → PICKED_UP → DELIVERED)
// and dashboard layout so the hero visual reads as actual product UI.
function StatusCard() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(3) // show final state, no animation
      return
    }
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % STATUS_FLOW.length)
    }, 1600)
    return () => clearInterval(timer)
  }, [])

  const status = STATUS_FLOW[step]

  return (
    <div className="hero__card" role="img" aria-label="Reflex delivery status dashboard preview">
      <div className="hero__card-header">
        <span className="hero__card-dot" />
        <span className="hero__card-title">DELIVERY STATUS</span>
        <span className="hero__card-id">#RF-1042</span>
      </div>

      <div className="hero__card-route">
        <span className="hero__card-place">
          <BoxIcon width={14} height={14} />
          Nairobi CBD
        </span>
        <span className="hero__card-line" aria-hidden="true">
          <span className="hero__card-line-progress" style={{ width: `${(step / (STATUS_FLOW.length - 1)) * 100}%` }} />
        </span>
        <span className="hero__card-place">
          <CheckIcon width={14} height={14} />
          Westlands
        </span>
      </div>

      <div className="hero__card-steps">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className={`hero__step ${i <= step ? 'hero__step--done' : ''} ${i === step ? 'hero__step--current' : ''}`}>
            <span className="hero__step-dot" />
            <span className="hero__step-label">{s.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <StatusBadge status={status} />
    </div>
  )
}

function FloatingCards() {
  return (
    <>
      <div className="hero__float hero__float--one" aria-hidden="true">
        <span className="hero__float-tag">NEW DELIVERY</span>
        <span className="hero__float-route">Nairobi → Westlands</span>
        <span className="hero__float-meta">Rider Assigned <CheckIcon width={12} height={12} /></span>
      </div>
      <div className="hero__float hero__float--two" aria-hidden="true">
        <span className="hero__float-tag hero__float-tag--done">DELIVERY COMPLETED</span>
        <span className="hero__float-route">Kilimani → Kileleshwa</span>
        <span className="hero__float-meta">Proof of Delivery Received <CheckIcon width={12} height={12} /></span>
      </div>
    </>
  )
}

function Hero() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  // Same convention as the navbar: signed-out → /login, signed-in → dashboard
  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      const roleRoutes = { rider: '/rider', dispatcher: '/dispatcher', retailer: '/retailer', customer: '/rider' }
      navigate(roleRoutes[user.role] || '/login')
    } else {
      navigate('/login')
    }
  }

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__copy">
          <span className="hero__eyebrow">REFLEX · DELIVERY COORDINATION PLATFORM</span>
          <h1 id="hero-title" className="hero__title">
            SMARTER DELIVERY WITH REFLEX
          </h1>
          <p className="hero__tagline">From request to delivery, with you till the last mile.</p>
          <p className="hero__desc">
            Reflex connects retailers, dispatchers, and riders through one seamless delivery workflow.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary hero__btn" onClick={handleGetStarted}>
              GET STARTED
            </button>
            <button
              className="btn btn--secondary hero__btn"
              onClick={() => scrollToSection('how-it-works')}
            >
              EXPLORE REFLEX
              <ArrowRightIcon width={16} height={16} />
            </button>
          </div>
          <p className="hero__note">
            <BoltIcon width={13} height={13} />
            Retailers, dispatchers, and riders — one connected workflow.
          </p>
        </div>

        <div className="hero__visual">
          <StatusCard />
          <FloatingCards />
        </div>
      </div>
    </section>
  )
}

export default Hero
