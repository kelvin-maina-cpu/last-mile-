import { deliveryService, ApiError } from '../../services/api/deliveryService'

const STATUS_TRANSITIONS = {
  ASSIGNED: { next: 'PICKED_UP', label: 'Pick Up', variant: 'primary' },
  PICKED_UP: { next: 'POD', label: 'Proof of Delivery', variant: 'success' },
  DELIVERED: null,
}

function StatusControls({ deliveryId, currentStatus, onStatusUpdated, onError, onOpenPOD }) {
  const transition = STATUS_TRANSITIONS[currentStatus]

  if (!transition) {
    return null
  }

  const handleStatusUpdate = async () => {
    // If this is the POD trigger, open the POD flow instead
    if (transition.next === 'POD' && onOpenPOD) {
      onOpenPOD()
      return
    }

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