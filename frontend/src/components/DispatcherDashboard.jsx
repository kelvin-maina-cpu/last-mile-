import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import DeliveryCard from './delivery/DeliveryCard'
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
      const index = prev.findIndex((d) => d.id === updatedDelivery.id)
      if (index === -1) {
        return [updatedDelivery, ...prev]
      }
      const updated = [...prev]
      updated[index] = updatedDelivery
      return updated
    })
  }, [])

  const handleRealtimeEvent = useCallback((payload) => {
    if (payload.type === 'deliveryRemoved') {
      setDeliveries((prev) => prev.filter((d) => d.id !== payload.deliveryId))
    } else {
      handleDeliveryUpdate(payload)
    }
  }, [handleDeliveryUpdate])

  const { connectionState } = useDeliveryUpdates(user?.id || 'dispatcher-001', handleRealtimeEvent)

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const filteredDeliveries = deliveries.filter((d) => {
    if (filter === 'all') return true
    return d.status === filter
  })

  const statusCounts = {
    all: deliveries.length,
    OPEN: deliveries.filter((d) => d.status === 'OPEN').length,
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

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">!</span>
          <span className="error-banner__message">{error}</span>
          <button className="error-banner__retry" onClick={fetchDeliveries}>
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'OPEN', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'].map((tab) => (
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
        <div className="empty-state">
          <p className="empty-state__icon">📦</p>
          <p className="empty-state__title">
            {filter === 'all'
              ? 'No deliveries yet'
              : `No ${filter.replace('_', ' ').toLowerCase()} deliveries`}
          </p>
          <p className="empty-state__hint">
            {filter === 'all'
              ? 'Create a new delivery from the Retailer page to get started.'
              : 'Try selecting a different filter.'}
          </p>
        </div>
      ) : (
        <div className="delivery-grid">
          {filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="dispatcher-card-wrapper">
              <DeliveryCard delivery={delivery} />
              {delivery.status === 'OPEN' && (
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
          ))}
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
