import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import StatusControls from './StatusControls'

function DeliveryDetail({ delivery, onStatusUpdated, onError }) {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  if (!delivery) {
    return (
      <div className="delivery-detail delivery-detail--empty">
        <p>Delivery not found.</p>
        <button className="btn btn--secondary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  const handleStatusUpdated = (updatedDelivery) => {
    setError(null)
    onStatusUpdated(updatedDelivery)
  }

  const handleError = (message) => {
    setError(message)
    onError?.(message)
  }

  return (
    <div className="delivery-detail">
      <button className="btn btn--back" onClick={() => navigate('/')}>
        Back to Dashboard
      </button>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">!</span>
          <span className="error-banner__message">{error}</span>
          <button className="error-banner__close" onClick={() => setError(null)}>
            x
          </button>
        </div>
      )}

      <div className="delivery-detail__card">
        <div className="delivery-detail__header">
          <h2 className="delivery-detail__id">Delivery #{delivery.id}</h2>
          <StatusBadge status={delivery.status} />
        </div>

        <div className="delivery-detail__info">
          <div className="delivery-detail__field">
            <label>Customer</label>
            <p>{delivery.customerName}</p>
          </div>
          <div className="delivery-detail__field">
            <label>Address</label>
            <p>{delivery.address}</p>
          </div>
          <div className="delivery-detail__field">
            <label>Item</label>
            <p>{delivery.itemDescription}</p>
          </div>
        </div>

        <div className="delivery-detail__actions">
          <StatusControls
            deliveryId={delivery.id}
            currentStatus={delivery.status}
            onStatusUpdated={handleStatusUpdated}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  )
}

export default DeliveryDetail