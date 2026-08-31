import { deliveryService, ApiError } from '../../services/api/deliveryService'

// Backend state machine: REQUESTED → ASSIGNED → PICKED_UP → DELIVERED
// Status endpoint only accepts: PICKED_UP, DELIVERED
// ASSIGNED is only created through the assign endpoint
const STATUS_TRANSITIONS = {
  ASSIGNED: { next: 'PICKED_UP', label: 'Mark as Picked Up', variant: 'primary' },
  PICKED_UP: { next: 'DELIVERED', label: 'Mark as Delivered', variant: 'success' },
  DELIVERED: null, // Terminal state
}

function StatusControls({ deliveryId, currentStatus, onStatusUpdated, onError }) {
  const transition = STATUS_TRANSITIONS[currentStatus]

  if (!transition) {
    return null
  }

  const handleStatusUpdate = async () => {
    try {
      const updatedDelivery = await deliveryService.updateDeliveryStatus(
        deliveryId,
        transition.next
      )
      onStatusUpdated(updatedDelivery)
    } catch (error) {
      if (error instanceof ApiError) {
        // Show specific error for invalid transitions
        if (error.code === 'INVALID_TRANSITION') {
          onError(`Cannot transition to ${transition.next}. ${error.message}`)
        } else {
          onError(error.message)
        }
      } else {
        onError('Failed to update status. Please try again.')
      }
    }
  }

  return (
    <button
      className={`status-btn status-btn--${transition.variant}`}
      onClick={handleStatusUpdate}
    >
      {transition.label}
    </button>
  )
}

export default StatusControls