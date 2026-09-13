import { useState } from 'react'
import { useReveal } from './homeUtils'
import { MailIcon, PinIcon, CheckIcon } from './Icons'

const SUBJECT_OPTIONS = [
  'General question',
  'Retailer onboarding',
  'Dispatcher onboarding',
  'Rider onboarding',
  'Report an issue',
]

// Prototype form — Reflex has no contact backend yet (see QandAButton.jsx:
// "there isn't a support email set up yet"), so this is a polished
// frontend-only interaction. It validates input, simulates a short send
// delay, and stores nothing. No technical errors are surfaced to the user.
function ContactSection() {
  const [headRef, headVisible] = useReveal()
  const [formRef, formVisible] = useReveal()

  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!values.name.trim()) next.name = 'Please enter your full name.'
    if (!values.email.trim()) {
      next.email = 'Please enter your email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = 'Please enter a valid email address.'
    }
    if (!values.subject) next.subject = 'Please choose a subject.'
    if (values.message.trim().length < 10) {
      next.message = 'Please write a message of at least 10 characters.'
    }
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setStatus('sending')
    // Prototype behavior: brief simulated send, then a success state.
    window.setTimeout(() => {
      setStatus('success')
    }, 900)
  }

  const resetForm = () => {
    setValues({ name: '', email: '', subject: '', message: '' })
    setErrors({})
    setStatus('idle')
  }

  return (
    <section id="contact" className="home-section home-section--alt" aria-labelledby="contact-title">
      <div className="home-section__inner contact__grid">
        <div
          ref={headRef}
          className={`contact__intro reveal ${headVisible ? 'reveal--visible' : ''}`}
        >
          <span className="home-eyebrow">Contact Us</span>
          <h2 id="contact-title" className="home-title">LET'S TALK</h2>
          <p className="home-subcopy">
            Have a question about Reflex? We'd love to hear from you.
          </p>
          <ul className="contact__points">
            <li>
              <MailIcon width={16} height={16} />
              Send a message with the form — it's the fastest way to reach the team.
            </li>
            <li>
              <PinIcon width={16} height={16} />
              Built for last-mile coordination in Nairobi and beyond.
            </li>
          </ul>
        </div>

        <div
          ref={formRef}
          className={`contact-card reveal ${formVisible ? 'reveal--visible' : ''}`}
        >
          {status === 'success' ? (
            <div className="contact-card__success" role="status">
              <span className="contact-card__success-icon">
                <CheckIcon width={26} height={26} />
              </span>
              <h3 className="contact-card__success-title">Message sent</h3>
              <p className="contact-card__success-text">
                Thanks, {values.name.trim().split(' ')[0]} — this prototype records your
                message locally. In the live product the team would get back to you at{' '}
                <strong>{values.email.trim()}</strong>.
              </p>
              <button className="btn btn--secondary contact-card__again" onClick={resetForm}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-form__row">
                <div className="contact-form__field">
                  <label htmlFor="contact-name">Full Name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={values.name}
                    onChange={handleChange('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  />
                  {errors.name && (
                    <span id="contact-name-error" className="contact-form__error" role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="contact-form__field">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={handleChange('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  />
                  {errors.email && (
                    <span id="contact-email-error" className="contact-form__error" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-subject">Subject</label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={values.subject}
                  onChange={handleChange('subject')}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                >
                  <option value="" disabled>
                    Choose a subject
                  </option>
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <span id="contact-subject-error" className="contact-form__error" role="alert">
                    {errors.subject}
                  </span>
                )}
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="Tell us what you need…"
                  value={values.message}
                  onChange={handleChange('message')}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
                {errors.message && (
                  <span id="contact-message-error" className="contact-form__error" role="alert">
                    {errors.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn--primary contact-form__submit"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? (
                  <>
                    <span className="contact-form__spinner" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  'SEND MESSAGE'
                )}
              </button>
              <p className="contact-form__hint">
                Prototype form — messages aren't transmitted anywhere yet.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
