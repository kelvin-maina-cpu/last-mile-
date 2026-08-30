import { useState, useEffect, useCallback } from 'react'
import { socketService } from '../services/realtime/socketService'

export function useSocket(riderId) {
  const [connectionState, setConnectionState] = useState(socketService.getConnectionState())

  useEffect(() => {
    if (!riderId) return

    socketService.connect(riderId)

    const unsubscribe = socketService.on('connectionChange', ({ state }) => {
      setConnectionState(state)
    })

    return () => {
      unsubscribe()
      socketService.disconnect()
    }
  }, [riderId])

  const subscribe = useCallback((event, callback) => {
    return socketService.on(event, callback)
  }, [])

  return { connectionState, subscribe }
}

export function useDeliveryUpdates(riderId, onDeliveryUpdate) {
  const { connectionState, subscribe } = useSocket(riderId)

  useEffect(() => {
    const unsubscribes = [
      subscribe('deliveryAssigned', onDeliveryUpdate),
      subscribe('deliveryUpdated', onDeliveryUpdate),
      subscribe('deliveryRemoved', onDeliveryUpdate),
    ]

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [subscribe, onDeliveryUpdate])

  return { connectionState }
}