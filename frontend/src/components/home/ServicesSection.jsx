import { useReveal } from './homeUtils'
import { ClipboardIcon, UsersIcon, RadioIcon, ShieldCheckIcon, RouteIcon, LayersIcon } from './Icons'

// Every feature below exists in the shipped app — verified against source:
// - Delivery Management: RetailerDeliveryForm + /api/deliveries CRUD
// - Rider Assignment: RiderAssignment.jsx + dispatcher assign endpoint
// - Real-Time Status: socketService (delivery:created/assigned/status-updated)
// - Proof of Delivery: ProofOfDelivery.jsx (ID + photo) + complete endpoint
// - Delivery Coordination: three roles in one workflow (App.jsx routes)
// - Role-Based Experience: ProtectedRoute allowedRoles + per-role dashboards
const FEATURES = [
  {
    icon: ClipboardIcon,
    title: 'Delivery Management',
    description: 'Manage requests from creation through completion.',
  },
  {
    icon: UsersIcon,
    title: 'Rider Assignment',
    description: 'Connect requests with the right rider.',
  },
  {
    icon: RadioIcon,
    title: 'Real-Time Status Updates',
    description: 'Keep stakeholders informed as progress changes.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Proof of Delivery',
    description: 'Capture delivery evidence on completion.',
  },
  {
    icon: RouteIcon,
    title: 'Delivery Coordination',
    description: 'Retailers, dispatchers, and riders in one workflow.',
  },
  {
    icon: LayersIcon,
    title: 'Role-Based Experience',
    description: 'A focused experience per user role.',
  },
]

function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal()
  const Icon = feature.icon

  return (
    <article
      ref={ref}
      className={`feature-card reveal ${visible ? 'reveal--visible' : ''}`}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <span className="feature-card__icon">
        <Icon width={24} height={24} />
      </span>
      <h3 className="feature-card__title">{feature.title}</h3>
      <p className="feature-card__desc">{feature.description}</p>
    </article>
  )
}

function ServicesSection() {
  const [headRef, headVisible] = useReveal()

  return (
    <section id="services" className="home-section" aria-labelledby="services-title">
      <div className="home-section__inner">
        <div
          ref={headRef}
          className={`home-section__head home-section__head--center reveal ${headVisible ? 'reveal--visible' : ''}`}
        >
          <span className="home-eyebrow">Services</span>
          <h2 id="services-title" className="home-title">BUILT FOR SEAMLESS DELIVERY</h2>
          <p className="home-subcopy">
            Everything needed to coordinate deliveries across the people who make them happen.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesSection
