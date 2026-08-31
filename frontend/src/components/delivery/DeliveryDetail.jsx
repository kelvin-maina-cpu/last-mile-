import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from './StatusBadge'
import StatusControls from './StatusControls'
import ProofOfDelivery from './ProofOfDelivery'
import ProofViewer from './ProofViewer'

function DeliveryDetail({ delivery, onStatusUpdated, onError }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [error, setError] = useState(null)
  const [showPOD, setShowPOD] = useState(false)
  const [showProof, setShowProof] = useState(false)

  if (!delivery) {
    return (
      <div className="delivery-detail delivery-detail--empty">
        <p>Delivery not found.</p>
        <button className="btn btn--secondary" onClick={() => navigate('/rider')}>
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

  const handlePODComplete = (updatedDelivery) => {
    setShowPOD(false)
    setError(null)
    onStatusUpdated(updatedDelivery)
  }

  const riderName = user?.name || 'Rider'

  return (
    <div className="delivery-detail">
      <button className="btn btn--back" onClick={() => navigate('/rider')}>
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
          <h2 className="delivery-detail__id">Delivery #{(delivery._id || delivery.id).slice(-6)}</h2>
          <StatusBadge status={delivery.status} />
        </div>

        <div className="delivery-detail__info">
          <div className="delivery-detail__field">
            <label>Customer</label>
            <p>{delivery.customerName}</p>
          </div>
          <div className="delivery-detail__field">
            <label>Phone</label>
            <p>{delivery.customerPhone}</p>
          </div>
          <div className="delivery-detail__field">
            <label>Address</label>
            <p>{delivery.deliveryAddress}</p>
          </div>
          <div className="delivery-detail__field">
            <label>Item</label>
            <p>{delivery.itemDescription}</p>
          </div>
        </div>

        <div className="delivery-detail__actions">
          <StatusControls
            deliveryId={delivery._id || delivery.id}
            currentStatus={delivery.status}
            onStatusUpdated={handleStatusUpdated}
            onError={handleError}
          />
        </div>
      </div>

      {/* Proof of Delivery Modal */}
      {showPOD && (
        <ProofOfDelivery
          delivery={delivery}
          riderName={riderName}
          onComplete={handlePODComplete}
          onCancel={() => setShowPOD(false)}
        />
      )}

      {/* View Proof Modal */}
      {showProof && delivery.proofOfDelivery && (
        <ProofViewer
          proof={delivery.proofOfDelivery}
          onClose={() => setShowProof(false)}
        />
      )}
    </div>
  )
}

export default DeliveryDetail