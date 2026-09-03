import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import DeliveryCard from './delivery/DeliveryCard'
import EmptyState from './EmptyState'
import RiderAssignment from './RiderAssignment'
import { deliveryService, ApiError } from '../services/api/deliveryService'
import { useDeliveryUpdates } from '../hooks/useSocket'

function DispatcherDashboard() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await deliveryService.getDeliveries()
      setDeliveries(data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load deliveries. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDeliveryUpdate = useCallback((updatedDelivery) => {
    setDeliveries((prev) => {
      const id = updatedDelivery._id || updatedDelivery.id
      const index = prev.findIndex((d) => (d._id || d.id) === id)
      if (index === -1) {
        return [updatedDelivery, ...prev]
      }
      const updated = [...prev]
      updated[index] = updatedDelivery
      return updated
    })
  }, [])

  const handleRealtimeEvent = useCallback((payload) => {
    // Backend emits { delivery: {...} } or { delivery: {...}, rider: {...} }
    const delivery = payload.delivery || payload
    if (delivery) {
      handleDeliveryUpdate(delivery)
    }
  }, [handleDeliveryUpdate])

  const { connectionState } = useDeliveryUpdates(handleRealtimeEvent)

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const filteredDeliveries = deliveries.filter((d) => {
    if (filter === 'all') return true
    return d.status === filter
  })

  // Backend uses REQUESTED, not OPEN
  const statusCounts = {
    all: deliveries.length,
    REQUESTED: deliveries.filter((d) => d.status === 'REQUESTED').length,
    ASSIGNED: deliveries.filter((d) => d.status === 'ASSIGNED').length,
    PICKED_UP: deliveries.filter((d) => d.status === 'PICKED_UP').length,
    DELIVERED: deliveries.filter((d) => d.status === 'DELIVERED').length,
  }

  const handleAssignSuccess = (updatedDelivery) => {
    handleDeliveryUpdate(updatedDelivery)
    setSelectedDelivery(null)
  }

  return (
    <div className="dispatcher-dashboard">
      <header className="dispatcher-dashboard__header">
        <div>
          <h1>Dispatcher Dashboard</h1>
          <p className="dispatcher-dashboard__subtitle">
            Manage delivery requests and assign riders
          </p>
        </div>
        <div className="dispatcher-dashboard__meta">
          <span className={`connection-badge connection-badge--${connectionState}`}>
            {connectionState === 'connected' ? '● Live' : '○ Offline'}
          </span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__icon">📦</div>
          <div className="stat-card__value">{statusCounts.all}</div>
          <div className="stat-card__label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">⏳</div>
          <div className="stat-card__value">{statusCounts.REQUESTED}</div>
          <div className="stat-card__label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">🏍️</div>
          <div className="stat-card__value">{statusCounts.ASSIGNED + statusCounts.PICKED_UP}</div>
          <div className="stat-card__label">In Transit</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">✅</div>
          <div className="stat-card__value">{statusCounts.DELIVERED}</div>
          <div className="stat-card__label">Delivered</div>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">!</span>
          <span className="error-banner__message">{error}</span>
          <button className="error-banner__retry" onClick={fetchDeliveries}>
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs — uses REQUESTED instead of OPEN */}
      <div className="filter-tabs">
        {['all', 'REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'].map((tab) => (
          <button
            key={tab}
            className={`filter-tab ${filter === tab ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all' ? 'All' : tab.replace('_', ' ')}
            <span className="filter-tab__count">{statusCounts[tab]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>Loading deliveries...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <EmptyState
          icon="📦"
          title={filter === 'all' ? 'No deliveries yet' : `No ${filter.replace('_', ' ').toLowerCase()} deliveries`}
          hint={filter === 'all' ? 'Create a new delivery from the Retailer page to get started.' : 'Try selecting a different filter.'}
        />
      ) : (
        <div className="delivery-grid">
          {filteredDeliveries.map((delivery) => {
            const id = delivery._id || delivery.id
            return (
              <div key={id} className="dispatcher-card-wrapper">
                <DeliveryCard delivery={delivery} />
                {/* Only REQUESTED deliveries can be assigned */}
                {delivery.status === 'REQUESTED' && (
                  <button
                    className="btn btn--primary btn--assign"
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedDelivery(delivery)
                    }}
                  >
                    Assign Rider
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Rider Assignment Modal */}
      {selectedDelivery && (
        <RiderAssignment
          delivery={selectedDelivery}
          onSuccess={handleAssignSuccess}
          onCancel={() => setSelectedDelivery(null)}
        />
      )}
    </div>
  )
}

export default DispatcherDashboard
