import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../EmptyState'
import ConnectionIndicator from './ConnectionIndicator'
import RiderRating from './RiderRating'
import RiderProgress from './RiderProgress'
import RiderDeliveryCard from './RiderDeliveryCard'
import { deliveryService, ApiError } from '../../services/api/deliveryService'
import { getRiderDeliveryId, riderExperienceService } from '../../services/riderExperienceService'
import { useDeliveryUpdates } from '../../hooks/useSocket'

function RiderDashboard() {
  const { user, riderProfile } = useAuth()
  const [rider, setRider] = useState(null)
  const riderId = rider?._id || rider?.id
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDeliveries = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const resolvedRider = await deliveryService.getRiderByUserId(user.id)
      if (!resolvedRider) {
        setRider(null)
        setDeliveries([])
        setError('No rider profile is linked to this account.')
        return
      }
      setRider(resolvedRider)
      const data = await deliveryService.getAssignedDeliveries(resolvedRider._id || resolvedRider.id)
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
  }, [user?.id])

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
    setDeliveries((prev) => prev.filter((d) => getRiderDeliveryId(d) !== deliveryId))
  }, [])

  const handleRealtimeEvent = useCallback((payload) => {
    handleDeliveryUpdate(payload)
  }, [handleDeliveryUpdate])

  const { connectionState } = useDeliveryUpdates(handleRealtimeEvent)

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const getStatus = (delivery) => {
    const localState = riderExperienceService.getDeliveryState(riderId, getRiderDeliveryId(delivery))
    return localState.status || delivery.status
  }

  const activeDeliveries = deliveries.filter((d) => getStatus(d) !== 'DELIVERED')
  const completedDeliveries = deliveries.filter((d) => getStatus(d) === 'DELIVERED')
  const handleRiderError = (message) => setError(message)

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
                      <RiderDeliveryCard
                        key={getRiderDeliveryId(delivery)}
                        delivery={delivery}
                        riderId={riderId}
                        riderName={user?.name || 'Rider'}
                        onUpdated={handleDeliveryUpdate}
                        onError={handleRiderError}
                      />
                    ))}
                  </div>
                )}
              </section>

              {completedDeliveries.length > 0 && (
                <section className="rider-dashboard__section">
                  <h2>Completed ({completedDeliveries.length})</h2>
                  <div className="delivery-grid">
                    {completedDeliveries.map((delivery) => (
                      <RiderDeliveryCard
                        key={getRiderDeliveryId(delivery)}
                        delivery={delivery}
                        riderId={riderId}
                        riderName={user?.name || 'Rider'}
                        onUpdated={handleDeliveryUpdate}
                        onError={handleRiderError}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="rider-dashboard__sidebar">
          <RiderProgress riderId={riderId} completedCount={completedDeliveries.length} />
          <RiderRating riderId={riderId} />
        </aside>
      </div>
    </div>
  )
}

export default RiderDashboard