import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DeliveryDetail from '../components/delivery/DeliveryDetail'
import { deliveryService, ApiError } from '../services/api/deliveryService'
import { useDeliveryUpdates } from '../hooks/useSocket'

function DeliveryDetailPage() {
  const { deliveryId } = useParams()
  const { user } = useAuth()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  const fetchDelivery = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setNotFound(false)
      const data = await deliveryService.getDeliveryById(deliveryId)
      setDelivery(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true)
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load delivery. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [deliveryId])

  const handleDeliveryUpdate = useCallback((updatedDelivery) => {
    // Backend emits { delivery: {...} }
    const delivery = updatedDelivery.delivery || updatedDelivery
    const id = delivery._id || delivery.id
    if (id === deliveryId) {
      setDelivery(delivery)
    }
  }, [deliveryId])

  const handleDeliveryRemoved = useCallback((removedId) => {
    if (removedId === deliveryId) {
      setNotFound(true)
    }
  }, [deliveryId])

  const handleRealtimeEvent = useCallback((payload) => {
    if (payload.type === 'deliveryRemoved') {
      handleDeliveryRemoved(payload.deliveryId)
    } else {
      handleDeliveryUpdate(payload)
    }
  }, [handleDeliveryUpdate, handleDeliveryRemoved])

  useDeliveryUpdates(handleRealtimeEvent)

  useEffect(() => {
    fetchDelivery()
  }, [fetchDelivery])

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-state__spinner" />
        <p>Loading delivery...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="delivery-detail delivery-detail--empty">
        <p>This delivery no longer exists or has been removed.</p>
      </div>
    )
  }

  return (
    <DeliveryDetail
      delivery={delivery}
      onStatusUpdated={setDelivery}
      onError={setError}
    />
  )
}

export default DeliveryDetailPage