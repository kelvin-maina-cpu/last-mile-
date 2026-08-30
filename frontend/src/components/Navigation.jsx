import { NavLink } from 'react-router-dom'

function Navigation() {
  return (
    <nav className="navigation">
      <div className="navigation__brand">
        <span className="navigation__logo">Reflex</span>
        <span className="navigation__tagline">Delivery Coordination</span>
      </div>
      <div className="navigation__links">
        <NavLink
          to="/retailer"
          className={({ isActive }) =>
            `navigation__link ${isActive ? 'navigation__link--active' : ''}`
          }
        >
          Retailer
        </NavLink>
        <NavLink
          to="/dispatcher"
          className={({ isActive }) =>
            `navigation__link ${isActive ? 'navigation__link--active' : ''}`
          }
        >
          Dispatcher
        </NavLink>
        <NavLink
          to="/rider"
          className={({ isActive }) =>
            `navigation__link ${isActive ? 'navigation__link--active' : ''}`
          }
        >
          Rider
        </NavLink>
      </div>
    </nav>
  )
}

export default Navigation
