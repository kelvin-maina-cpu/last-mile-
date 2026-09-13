import { useNavigate } from 'react-router-dom'
import { scrollToSection } from './homeUtils'
import { BoltIcon } from './Icons'

function Footer() {
  const navigate = useNavigate()

  const goSection = (id) => (e) => {
    e.preventDefault()
    if (document.getElementById(id)) {
      scrollToSection(id)
    } else {
      scrollToSection('top')
    }
  }

  const goPage = (path) => (e) => {
    e.preventDefault()
    navigate(path)
  }

  const links = [
    { label: 'Home', href: '#top', onClick: goSection('top') },
    { label: 'About Us', href: '#about', onClick: goSection('about') },
    { label: 'Services', href: '#services', onClick: goSection('services') },
    { label: 'How It Works', href: '#how-it-works', onClick: goSection('how-it-works') },
    { label: 'Contact Us', href: '#contact', onClick: goSection('contact') },
  ]

  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <div className="home-footer__top">
          <a
            href="#top"
            className="home-footer__brand"
            onClick={goSection('top')}
            aria-label="Reflex — back to top"
          >
            <span className="home-footer__logo"><BoltIcon width={14} height={14} /></span>
            <span className="home-footer__name">REFLEX</span>
            <span className="home-footer__tagline">Precision logistics, from request to delivery.</span>
          </a>

          <nav className="home-footer__links" aria-label="Footer">
            {links.map((link) => (
              <a key={link.label} href={link.href} onClick={link.onClick}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="home-footer__bar">
          <span>© 2026 REFLEX. ALL RIGHTS RESERVED.</span>
          <span className="home-footer__legal">
            <a href="/privacy" onClick={goPage('/privacy')}>Privacy Policy</a>
            <span aria-hidden="true"> · </span>
            <a href="/terms" onClick={goPage('/terms')}>Terms &amp; Conditions</a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
