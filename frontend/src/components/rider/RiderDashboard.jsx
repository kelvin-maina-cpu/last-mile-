import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import DeliveryCard from '../delivery/DeliveryCard'
import EmptyState from '../EmptyState'
import ConnectionIndicator from './ConnectionIndicator'
import RiderRating from './RiderRating'
import { deliveryService, ApiError } from '../../services/api/deliveryService'
import { useDeliveryUpdates } from '../../hooks/useSocket'

function RiderDashboard() {
  const { user, riderProfile } = useAuth()
  const riderId = user?.id
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDeliveries = useCallback(async () => {
    if (!riderId) return
    try {
      setLoading(true)
      setError(null)
      const data = await deliveryService.getAssignedDeliveries(riderId)
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
  }, [riderId])

  const handleDeliveryUpdate = useCallback((updatedDelivery) => {
    // Backend emits { delivery: {...} }
    const delivery = updatedDelivery.delivery || updatedDelivery
    setDeliveries((prev) => {
      const id = delivery._id || delivery.id
      const index = prev.findIndex((d) => (d._id || d.id) === id)
      if (index === -1) {
        return [...prev, delivery]
      }
      const updated = [...prev]
      updated[index] = delivery
      return updated
    })
  }, [])

  const handleDeliveryRemoved = useCallback((deliveryId) => {
    setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId))
  }, [])

  const handleRealtimeEvent = useCallback((payload) => {
    handleDeliveryUpdate(payload)
  }, [handleDeliveryUpdate])

  const { connectionState } = useDeliveryUpdates(handleRealtimeEvent)

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const activeDeliveries = deliveries.filter((d) => d.status !== 'DELIVERED')
  const completedDeliveries = deliveries.filter((d) => d.status === 'DELIVERED')

  return (
    <div className="rider-dashboard">
      <header className="rider-dashboard__header">
        <div>
          <h1>My Deliveries</h1>
          {user && (
            <p className="rider-dashboard__rider-info">
              {user.name} · {riderProfile?.vehicle_type || 'Motorcycle'}
              {riderProfile?.phone && ` · ${riderProfile.phone}`}
            </p>
          )}
        </div>
        <ConnectionIndicator state={connectionState} />
      </header>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__icon">📦</div>
          <div className="stat-card__value">{deliveries.length}</div>
          <div className="stat-card__label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">🔥</div>
          <div className="stat-card__value">{activeDeliveries.length}</div>
          <div className="stat-card__label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">✅</div>
          <div className="stat-card__value">{completedDeliveries.length}</div>
          <div className="stat-card__label">Completed</div>
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

      <div className="rider-dashboard__grid">
        <div className="rider-dashboard__main">
          {loading ? (
            <div className="loading-state">
              <div className="loading-state__spinner" />
              <p>Loading deliveries...</p>
            </div>
          ) : (
            <>
              <section className="rider-dashboard__section">
                <h2>Active ({activeDeliveries.length})</h2>
                {activeDeliveries.length === 0 ? (
                  <EmptyState icon="🏍️" title="No active deliveries" hint="New assignments will appear here." compact />
                ) : (
                  <div className="delivery-grid">
                    {activeDeliveries.map((delivery) => (
                      <DeliveryCard key={delivery.id} delivery={delivery} />
                    ))}
                  </div>
                )}
              </section>

              {completedDeliveries.length > 0 && (
                <section className="rider-dashboard__section">
                  <h2>Completed ({completedDeliveries.length})</h2>
                  <div className="delivery-grid">
                    {completedDeliveries.map((delivery) => (
                      <DeliveryCard key={delivery.id} delivery={delivery} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="rider-dashboard__sidebar">
          <RiderRating />
        </aside>
      </div>
    </div>
  )
}

export default RiderDashboard