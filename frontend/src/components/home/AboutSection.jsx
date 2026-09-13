import { useReveal } from './homeUtils'
import { BoltIcon, RouteIcon } from './Icons'

function AboutSection() {
  const [headRef, headVisible] = useReveal()
  const [missionRef, missionVisible] = useReveal()
  const [visionRef, visionVisible] = useReveal()

  return (
    <section id="about" className="home-section home-section--alt" aria-labelledby="about-title">
      <div className="home-section__inner about__grid">
        <div
          ref={headRef}
          className={`about__copy reveal ${headVisible ? 'reveal--visible' : ''}`}
        >
          <span className="home-eyebrow">About Us</span>
          <h2 id="about-title" className="home-title">THE REFLEX PLATFORM</h2>
          <p className="about__body">
            Reflex is a delivery coordination platform designed to connect retailers,
            dispatchers, and riders through one seamless workflow. By bringing delivery
            requests, rider assignment, progress updates, and proof of delivery into one
            experience, Reflex makes last-mile coordination simpler, clearer, and more connected.
          </p>
          <div className="about__pulse" aria-hidden="true">
            <RouteIcon width={20} height={20} />
            <span className="about__pulse-line" />
            <span className="about__pulse-node" />
            <span className="about__pulse-line" />
            <BoltIcon width={16} height={16} />
          </div>
        </div>

        <div className="about__cards">
          <article
            ref={missionRef}
            className={`about-card reveal ${missionVisible ? 'reveal--visible' : ''}`}
          >
            <span className="about-card__tag">Our Mission</span>
            <h3 className="about-card__title">Make delivery coordination simpler, faster, and more transparent.</h3>
          </article>
          <article
            ref={visionRef}
            className={`about-card reveal ${visionVisible ? 'reveal--visible' : ''}`}
            style={{ transitionDelay: '120ms' }}
          >
            <span className="about-card__tag about-card__tag--accent">Our Vision</span>
            <h3 className="about-card__title">Create a more connected and efficient last-mile delivery experience.</h3>
          </article>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
