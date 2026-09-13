import { useReveal } from './homeUtils'
import { BoxIcon, MapIcon, BikeIcon } from './Icons'

// Descriptions verified against the real app:
// - Retailers create requests via the delivery form (RetailerDeliveryForm.jsx)
// - Dispatchers review REQUESTED deliveries and assign riders (DispatcherDashboard.jsx, RiderAssignment.jsx)
// - Riders receive assignments, update status, and complete with proof (RiderDashboardPage.jsx, RiderDeliveryActions.jsx)
const ROLES = [
  {
    icon: BoxIcon,
    title: 'RETAILER',
    description:
      'Create and manage delivery requests. Retailers initiate requests and track delivery progress.',
    points: ['Create delivery requests', 'Track progress in real time'],
  },
  {
    icon: MapIcon,
    title: 'DISPATCHER',
    description:
      'Coordinate deliveries and assign riders. Dispatchers review requests and connect them with available riders.',
    points: ['Review incoming requests', 'Assign available riders'],
  },
  {
    icon: BikeIcon,
    title: 'RIDER',
    description:
      'Receive, update, and complete deliveries. Riders view assignments, update progress, and complete the workflow.',
    points: ['View active assignments', 'Update status en route'],
  },
]

function RoleCard({ role, index }) {
  const [ref, visible] = useReveal()
  const Icon = role.icon

  return (
    <article
      ref={ref}
      className={`role-card reveal ${visible ? 'reveal--visible' : ''}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <span className="role-card__icon">
        <Icon width={26} height={26} />
      </span>
      <h3 className="role-card__title">{role.title}</h3>
      <p className="role-card__desc">{role.description}</p>
      <ul className="role-card__points">
        {role.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </article>
  )
}

function ValueSection() {
  const [headRef, headVisible] = useReveal()

  return (
    <section id="roles" className="home-section" aria-labelledby="roles-title">
      <div className="home-section__inner">
        <div
          ref={headRef}
          className={`home-section__head home-section__head--center reveal ${headVisible ? 'reveal--visible' : ''}`}
        >
          <span className="home-eyebrow">Platform Overview</span>
          <h2 id="roles-title" className="home-title">
            ONE PLATFORM. THREE ROLES. ONE SEAMLESS FLOW.
          </h2>
          <p className="home-subcopy">
            Reflex brings every part of the delivery workflow into one connected experience.
          </p>
        </div>

        <div className="role-grid">
          {ROLES.map((role, i) => (
            <RoleCard key={role.title} role={role} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ValueSection
