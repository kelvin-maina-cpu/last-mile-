import { useReveal } from './homeUtils'
import { ClipboardIcon, UsersIcon, BoxIcon, RadioIcon, ShieldCheckIcon, CheckIcon } from './Icons'

// Steps match the real app flow end-to-end:
// backend validates REQUESTED → ASSIGNED (dispatcher assigns rider) →
// PICKED_UP → OUT_FOR_DELIVERY (rider updates en route) → DELIVERED with
// required proof (server/src/routes/deliveries.js; ProofOfDelivery.jsx).
const STEPS = [
  {
    icon: ClipboardIcon,
    title: 'REQUEST',
    description: 'A retailer creates a delivery request.',
  },
  {
    icon: UsersIcon,
    title: 'ASSIGN',
    description: 'A dispatcher reviews the request and assigns it to a rider.',
  },
  {
    icon: BoxIcon,
    title: 'PICK UP',
    description: 'The rider receives the assignment and picks up the delivery.',
  },
  {
    icon: RadioIcon,
    title: 'OUT FOR DELIVERY',
    description: 'The rider updates delivery status en route.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'PROOF OF DELIVERY',
    description: 'Delivery proof is captured on completion.',
  },
  {
    icon: CheckIcon,
    title: 'COMPLETE',
    description: 'The delivery reaches its completed state.',
  },
]

function Step({ step, index }) {
  const [ref, visible] = useReveal()
  const Icon = step.icon

  return (
    <li
      ref={ref}
      className={`flow-step reveal ${visible ? 'reveal--visible' : ''}`}
      style={{ transitionDelay: `${(index % 2) * 90}ms` }}
    >
      <span className="flow-step__icon">
        <Icon width={22} height={22} />
      </span>
      <div className="flow-step__body">
        <span className="flow-step__num">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="flow-step__title">{step.title}</h3>
        <p className="flow-step__desc">{step.description}</p>
      </div>
    </li>
  )
}

function HowItWorks() {
  const [headRef, headVisible] = useReveal()
  const [listRef, listVisible] = useReveal()

  return (
    <section id="how-it-works" className="home-section home-section--alt" aria-labelledby="flow-title">
      <div className="home-section__inner">
        <div
          ref={headRef}
          className={`home-section__head home-section__head--center reveal ${headVisible ? 'reveal--visible' : ''}`}
        >
          <span className="home-eyebrow">The Workflow</span>
          <h2 id="flow-title" className="home-title">HOW REFLEX WORKS</h2>
          <p className="home-subcopy">
            From the first request to successful delivery, Reflex keeps the workflow connected.
          </p>
        </div>

        <ol
          ref={listRef}
          className={`flow-timeline ${listVisible ? 'flow-timeline--visible' : ''}`}
          aria-label="Delivery workflow steps"
        >
          {STEPS.map((step, i) => (
            <Step key={step.title} step={step} index={i} />
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
