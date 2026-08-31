import { useState, useEffect } from 'react'
import { deliveryService, ApiError } from '../services/api/deliveryService'

function RiderAssignment({ delivery, onSuccess, onCancel }) {
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedRiderId, setSelectedRiderId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const data = await deliveryService.getRiders()
        setRiders(data)
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to load available riders.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchRiders()
  }, [])

  const handleAssign = async () => {
    if (!selectedRiderId) return

    setAssigning(true)
    setError(null)
    try {
      const deliveryId = delivery._id || delivery.id
      const updated = await deliveryService.assignRider(deliveryId, selectedRiderId)
      onSuccess(updated)
    } catch (err) {
      if (err instanceof ApiError) {
        // Show specific error for unavailable rider
        if (err.code === 'RIDER_UNAVAILABLE') {
          setError('That rider is no longer available. Please select another rider.')
        } else if (err.code === 'INVALID_TRANSITION') {
          setError('This delivery cannot be assigned. It may have already been assigned.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to assign rider. Please try again.')
      }
    } finally {
      setAssigning(false)
    }
  }

  const selectedRider = riders.find((r) => (r._id || r.id) === selectedRiderId)
  // Backend uses _id, frontend may use id
  const deliveryId = delivery._id || delivery.id

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Assign Rider</h2>
          <button className="modal__close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal__body">
          <div className="modal__delivery-info">
            <p className="modal__delivery-label">Delivery #{deliveryId.slice(-6)}</p>
            <p className="modal__delivery-customer">{delivery.customerName}</p>
            <p className="modal__delivery-address">{delivery.deliveryAddress}</p>
          </div>

          {error && (
            <div className="error-banner error-banner--compact" role="alert">
              <span className="error-banner__message">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="loading-state loading-state--compact">
              <div className="loading-state__spinner" />
              <p>Loading riders...</p>
            </div>
          ) : riders.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <p>No riders found.</p>
            </div>
          ) : (
            <div className="rider-list">
              {riders.map((rider) => {
                const riderId = rider._id || rider.id
                return (
                  <label
                    key={riderId}
                    className={`rider-option ${selectedRiderId === riderId ? 'rider-option--selected' : ''} ${!rider.available ? 'rider-option--unavailable' : ''}`}
                  >
                    <input
                      type="radio"
                      name="rider"
                      value={riderId}
                      checked={selectedRiderId === riderId}
                      onChange={() => setSelectedRiderId(riderId)}
                      disabled={assigning || !rider.available}
                      className="rider-option__radio"
                    />
                    <div className="rider-option__info">
                      <span className="rider-option__name">{rider.name}</span>
                      <span className="rider-option__phone">{rider.phone}</span>
                    </div>
                    <span className="rider-option__status">
                      {rider.available ? 'Available' : 'Busy'}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleAssign}
            disabled={!selectedRiderId || assigning}
          >
            {assigning ? (
              <span className="btn__loading">
                <span className="btn__spinner" />
                Assigning...
              </span>
            ) : (
              `Assign ${selectedRider ? selectedRider.name : 'Rider'}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RiderAssignment
