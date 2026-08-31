import { useState, useEffect, useCallback } from 'react'
import { socketService } from '../services/realtime/socketService'

export function useSocket() {
  const [connectionState, setConnectionState] = useState(socketService.getConnectionState())

  useEffect(() => {
    // Connect to Socket.IO (no riderId needed for MVP)
    socketService.connect()

    const unsubscribe = socketService.on('connectionChange', ({ state }) => {
      setConnectionState(state)
    })

    return () => {
      unsubscribe()
      socketService.disconnect()
    }
  }, [])

  const subscribe = useCallback((event, callback) => {
    return socketService.on(event, callback)
  }, [])

  return { connectionState, subscribe }
}

export function useDeliveryUpdates(onDeliveryUpdate) {
  const { connectionState, subscribe } = useSocket()

  useEffect(() => {
    // Listen for backend Socket.IO events
    const unsubscribes = [
      subscribe('delivery:created', onDeliveryUpdate),
      subscribe('delivery:assigned', onDeliveryUpdate),
      subscribe('delivery:status-updated', onDeliveryUpdate),
    ]

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [subscribe, onDeliveryUpdate])

  return { connectionState }
}