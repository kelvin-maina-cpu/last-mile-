import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ROLES = [
  {
    id: 'retailer',
    label: 'Retailer',
    description: 'Create and manage delivery requests for your customers',
    icon: '📦',
    route: '/retailer',
  },
  {
    id: 'dispatcher',
    label: 'Dispatcher',
    description: 'Assign riders and track all deliveries in your area',
    icon: '🗺️',
    route: '/dispatcher',
  },
  {
    id: 'rider',
    label: 'Rider',
    description: 'View your assignments and update delivery status',
    icon: '🏍️',
    route: '/rider',
  },
]

function LoginPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)

  const handleContinue = () => {
    if (selectedRole) {
      const role = ROLES.find((r) => r.id === selectedRole)
      navigate(role.route)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__icon">&#9889;</span>
          <h1 className="login-card__title">REFLEX</h1>
          <p className="login-card__subtitle">Select your role to continue</p>
        </div>

        <div className="role-list">
          {ROLES.map((role) => (
            <label
              key={role.id}
              className={`role-option ${selectedRole === role.id ? 'role-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="role"
                value={role.id}
                checked={selectedRole === role.id}
                onChange={() => setSelectedRole(role.id)}
                className="role-option__radio"
              />
              <span className="role-option__icon">{role.icon}</span>
              <div className="role-option__info">
                <span className="role-option__label">{role.label}</span>
                <span className="role-option__desc">{role.description}</span>
              </div>
            </label>
          ))}
        </div>

        <button
          className="btn btn--primary btn--block login-card__btn"
          disabled={!selectedRole}
          onClick={handleContinue}
        >
          Continue as {selectedRole ? ROLES.find((r) => r.id === selectedRole)?.label : '...'}
        </button>

        <button
          className="login-card__back"
          onClick={() => navigate('/')}
        >
          &larr; Back to home
        </button>
      </div>
    </div>
  )
}

export default LoginPage
