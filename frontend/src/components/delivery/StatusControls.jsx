import { deliveryService, ApiError } from '../../services/api/deliveryService'

const STATUS_TRANSITIONS = {
  ASSIGNED: { next: 'PICKED_UP', label: 'Pick Up', variant: 'primary' },
  PICKED_UP: { next: 'DELIVERED', label: 'Mark Delivered', variant: 'success' },
  DELIVERED: null,
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
        onError(error.message)
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