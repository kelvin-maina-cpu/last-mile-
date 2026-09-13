import { useNavigate } from 'react-router-dom'
import { BoltIcon } from './Icons'

// Shared layout for the public Privacy Policy / Terms & Conditions pages.
// These are real standalone pages (no login required) linked from the footer.
function LegalPage({ title, updated, children }) {
  const navigate = useNavigate()

  return (
    <div className="legal">
      <header className="legal__header">
        <div className="legal__brand">
          <span className="legal__logo"><BoltIcon width={16} height={16} /></span>
          <span className="legal__name">REFLEX</span>
        </div>
        <button className="legal__back" onClick={() => navigate('/')}>
          &larr; Back to home
        </button>
      </header>

      <main className="legal__main">
        <h1 className="legal__title">{title}</h1>
        <p className="legal__updated">Last updated: {updated}</p>
        {children}
      </main>

      <footer className="legal__footer">
        <span>© 2026 REFLEX. ALL RIGHTS RESERVED.</span>
      </footer>
    </div>
  )
}

export default LegalPage
