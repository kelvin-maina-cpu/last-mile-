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
        const data = await deliveryService.getAvailableRiders()
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
      const updated = await deliveryService.assignRider(delivery.id, selectedRiderId)
      onSuccess(updated)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to assign rider. Please try again.')
      }
    } finally {
      setAssigning(false)
    }
  }

  const selectedRider = riders.find((r) => r.id === selectedRiderId)

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
            <p className="modal__delivery-label">Delivery #{delivery.id}</p>
            <p className="modal__delivery-customer">{delivery.customerName}</p>
            <p className="modal__delivery-address">{delivery.address}</p>
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
              <p>No available riders found.</p>
            </div>
          ) : (
            <div className="rider-list">
              {riders.map((rider) => (
                <label
                  key={rider.id}
                  className={`rider-option ${selectedRiderId === rider.id ? 'rider-option--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="rider"
                    value={rider.id}
                    checked={selectedRiderId === rider.id}
                    onChange={() => setSelectedRiderId(rider.id)}
                    disabled={assigning}
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
              ))}
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
