import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useActiveSection, scrollToSection } from './homeUtils'
import { BoltIcon, MenuIcon, CloseIcon, SunIcon, MoonIcon } from './Icons'

const NAV_LINKS = [
  { id: 'top', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'services', label: 'Services' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'contact', label: 'Contact Us' },
]

const SECTION_IDS = ['about', 'services', 'how-it-works', 'contact']

const ROLE_ROUTES = {
  rider: '/rider',
  dispatcher: '/dispatcher',
  retailer: '/retailer',
  customer: '/rider',
}

function Navbar({ isLight, onToggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection(SECTION_IDS)

  // Sticky transition: subtle background once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on Escape for keyboard users
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Returning to the homepage from another route — make sure the menu is closed
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleSectionClick = (id) => {
    setMenuOpen(false)
    if (id === 'top') {
      scrollToSection('top')
      return
    }
    // Sections land phase by phase — only scroll to ones that exist yet
    if (document.getElementById(id)) scrollToSection(id)
  }

  // Signed out → existing /login flow (demo roles + Google auth).
  // Signed in → straight to the user's role dashboard.
  const handleAuthClick = () => {
    setMenuOpen(false)
    if (isAuthenticated && user) {
      navigate(ROLE_ROUTES[user.role] || '/login')
    } else {
      navigate('/login')
    }
  }

  const renderLinks = () =>
    NAV_LINKS.map((link) => (
      <a
        key={link.id}
        href={link.id === 'top' ? '#top' : `#${link.id}`}
        className={`home-nav__link ${active === link.id ? 'home-nav__link--active' : ''}`}
        onClick={(e) => { e.preventDefault(); handleSectionClick(link.id) }}
      >
        {link.label}
      </a>
    ))

  const renderAuth = () => (
    <button className="home-nav__login" onClick={handleAuthClick}>
      {isAuthenticated ? 'DASHBOARD' : 'LOGIN'}
    </button>
  )

  return (
    <header className={`home-nav ${scrolled ? 'home-nav--scrolled' : ''}`}>
      <div className="home-nav__inner">
        <a
          href="#top"
          className="home-nav__brand"
          onClick={(e) => { e.preventDefault(); handleSectionClick('top') }}
          aria-label="Reflex — back to top"
        >
          <span className="home-nav__logo"><BoltIcon width={18} height={18} /></span>
          <span className="home-nav__name">REFLEX</span>
        </a>

        <nav className="home-nav__links" aria-label="Primary">
          {renderLinks()}
        </nav>

        <div className="home-nav__actions">
          <button
            className="theme-toggle"
            onClick={() => { setMenuOpen(false); onToggleTheme() }}
            aria-label="Toggle light/dark mode"
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? <MoonIcon width={18} height={18} /> : <SunIcon width={18} height={18} />}
          </button>
          <div className="home-nav__auth">{renderAuth()}</div>
          <button
            className="home-nav__hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="home-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="home-mobile-menu"
        className={`home-nav__mobile ${menuOpen ? 'home-nav__mobile--open' : ''}`}
        role="menu"
        aria-label="Menu"
      >
        <nav className="home-nav__mobile-links" aria-label="Mobile">
          {renderLinks()}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
