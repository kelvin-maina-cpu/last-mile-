import { useReveal } from './homeUtils'
import { StarIcon } from './Icons'

// Representative prototype stories — clearly labeled below and on each card.
// No real companies or verified customer claims are referenced.
const TESTIMONIALS = [
  {
    initials: 'AK',
    name: 'Amara K.',
    role: 'Retailer',
    rating: 5,
    quote:
      'Reflex gives us one place to raise a delivery request and watch it move — from assignment to proof of delivery, we always know where things stand.',
  },
  {
    initials: 'DO',
    name: 'David O.',
    role: 'Dispatcher',
    rating: 5,
    quote:
      'Reviewing incoming requests and matching them to available riders used to be scattered across calls and notes. Now the whole flow lives in one dashboard.',
  },
  {
    initials: 'JM',
    name: 'James M.',
    role: 'Rider',
    rating: 5,
    quote:
      'My assignments, status updates, and proof capture are all in one place. Nothing gets lost between pickup and delivery.',
  },
]

function Stars({ count }) {
  return (
    <span
      className="testimonial-card__stars"
      role="img"
      aria-label={`Rated ${count} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled width={15} height={15} />
      ))}
    </span>
  )
}

function TestimonialCard({ item, index }) {
  const [ref, visible] = useReveal()

  return (
    <article
      ref={ref}
      className={`testimonial-card reveal ${visible ? 'reveal--visible' : ''}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <Stars count={item.rating} />
      <blockquote className="testimonial-card__quote">“{item.quote}”</blockquote>
      <footer className="testimonial-card__footer">
        <span className="testimonial-card__avatar" aria-hidden="true">{item.initials}</span>
        <div>
          <span className="testimonial-card__name">{item.name}</span>
          <span className="testimonial-card__role">
            {item.role}
            <span className="testimonial-card__badge">Prototype story</span>
          </span>
        </div>
      </footer>
    </article>
  )
}

function Testimonials() {
  const [headRef, headVisible] = useReveal()
  const [noteRef, noteVisible] = useReveal()

  return (
    <section id="testimonials" className="home-section" aria-labelledby="testimonials-title">
      <div className="home-section__inner">
        <div
          ref={headRef}
          className={`home-section__head home-section__head--center reveal ${headVisible ? 'reveal--visible' : ''}`}
        >
          <span className="home-eyebrow">Testimonials</span>
          <h2 id="testimonials-title" className="home-title">WHAT OUR USERS SAY</h2>
          <p className="home-subcopy">Designed around the people who keep deliveries moving.</p>
        </div>

        <div className="testimonial-track" role="list">
          {TESTIMONIALS.map((item, i) => (
            <div role="listitem" key={item.name}>
              <TestimonialCard item={item} index={i} />
            </div>
          ))}
        </div>

        <p
          ref={noteRef}
          className={`testimonials__note reveal ${noteVisible ? 'reveal--visible' : ''}`}
        >
          Representative stories from our prototype — illustrative of how Reflex works,
          not verified customer claims.
        </p>
      </div>
    </section>
  )
}

export default Testimonials
