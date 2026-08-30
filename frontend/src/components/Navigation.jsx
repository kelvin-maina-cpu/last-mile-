import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleIcons = {
    rider: '🏍️',
    dispatcher: '🗺️',
    retailer: '📦',
    customer: '🏠',
  }

  return (
    <nav className="navigation">
      <div className="navigation__brand">
        <span className="navigation__logo">Reflex</span>
        <span className="navigation__tagline">Delivery Coordination</span>
      </div>
      <div className="navigation__links">
        {isAuthenticated && user?.role === 'retailer' && (
          <NavLink
            to="/retailer"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            Retailer
          </NavLink>
        )}
        {isAuthenticated && (user?.role === 'dispatcher' || user?.role === 'retailer') && (
          <NavLink
            to="/dispatcher"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            Dispatcher
          </NavLink>
        )}
        {isAuthenticated && (user?.role === 'rider' || user?.role === 'customer') && (
          <NavLink
            to="/rider"
            className={({ isActive }) =>
              `navigation__link ${isActive ? 'navigation__link--active' : ''}`
            }
          >
            Rider
          </NavLink>
        )}
        {isAuthenticated && (
          <div className="navigation__user">
            <span className="navigation__user-icon">{roleIcons[user?.role] || '👤'}</span>
            <span className="navigation__user-name">{user?.name}</span>
            <button className="navigation__logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation
