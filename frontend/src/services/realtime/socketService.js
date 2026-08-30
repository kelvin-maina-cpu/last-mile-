const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.isConnecting = false
    this.connectionState = 'disconnected'
  }

  connect(riderId) {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    this.isConnecting = true
    this.connectionState = 'connecting'

    try {
      this.socket = new WebSocket(`${WS_URL}?riderId=${riderId}`)

      this.socket.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.connectionState = 'connected'
        this._emit('connectionChange', { state: 'connected' })
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this._emit(data.type, data.payload)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.socket.onclose = (event) => {
        this.isConnecting = false
        this.connectionState = 'disconnected'
        this._emit('connectionChange', { state: 'disconnected' })

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this._scheduleReconnect(riderId)
        }
      }

      this.socket.onerror = () => {
        this.isConnecting = false
        this.connectionState = 'error'
        this._emit('connectionChange', { state: 'error' })
      }
    } catch (error) {
      this.isConnecting = false
      this.connectionState = 'error'
      this._emit('connectionChange', { state: 'error' })
    }
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting')
      this.socket = null
    }
    this.connectionState = 'disconnected'
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    return () => this.off(event, callback)
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  getConnectionState() {
    return this.connectionState
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  _scheduleReconnect(riderId) {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    this.connectionState = 'reconnecting'
    this._emit('connectionChange', { state: 'reconnecting', attempt: this.reconnectAttempts })

    setTimeout(() => {
      this.connect(riderId)
    }, delay)
  }
}

export const socketService = new SocketService()