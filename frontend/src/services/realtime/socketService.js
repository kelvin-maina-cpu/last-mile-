import { WS_URL, HAS_PRIMARY_BACKEND, FALLBACK_WS_URL } from '../../config/apiConfig'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.isConnecting = false
    this.connectionState = 'disconnected'
    this.isUsingFallback = false
  }

  connect(riderId) {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    this.isConnecting = true
    this.connectionState = 'connecting'

    // Try primary WS first, then fallback
    const primaryUrl = WS_URL
    const fallbackUrl = FALLBACK_WS_URL

    if (primaryUrl) {
      this._attemptConnect(riderId, primaryUrl, fallbackUrl)
    } else {
      // No primary configured — connect directly to fallback
      this._attemptConnect(riderId, fallbackUrl, fallbackUrl)
    }
  }

  _attemptConnect(riderId, primaryWsUrl, fallbackWsUrl) {
    try {
      const url = `${primaryWsUrl}?riderId=${riderId}`
      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.connectionState = 'connected'
        if (this.isUsingFallback) {
          console.log('[WS] Connected to fallback WebSocket server')
        } else {
          console.log('[WS] Connected to primary WebSocket server')
        }
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
          // If primary WS failed and we have a fallback, try it
          if (!this.isUsingFallback && fallbackWsUrl && HAS_PRIMARY_BACKEND) {
            console.log('[WS] Primary WebSocket unavailable, trying fallback')
            this.isUsingFallback = true
            this.reconnectAttempts = 0
            this._attemptConnect(riderId, fallbackWsUrl, null)
            return
          }
          this._scheduleReconnect(riderId, fallbackWsUrl)
        }
      }

      this.socket.onerror = (event) => {
        console.warn(`[WS] Error connecting to ${this.isUsingFallback ? 'fallback' : 'primary'} WebSocket`)
        this.isConnecting = false
        this.connectionState = 'error'
        this._emit('connectionChange', { state: 'error' })

        // On error, if we have a fallback available, try it on close
        if (!this.isUsingFallback && fallbackWsUrl && HAS_PRIMARY_BACKEND) {
          // The onclose handler will handle the fallback attempt
        }
      }
    } catch (error) {
      console.warn('[WS] WebSocket connection error:', error.message)
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

  _scheduleReconnect(riderId, fallbackWsUrl) {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    this.connectionState = 'reconnecting'
    this._emit('connectionChange', { state: 'reconnecting', attempt: this.reconnectAttempts })

    setTimeout(() => {
      // On reconnect, if not using fallback and primary was unavailable,
      // try the fallback server
      if (!this.isUsingFallback && fallbackWsUrl && HAS_PRIMARY_BACKEND) {
        this.isUsingFallback = true
        this.reconnectAttempts = 0
        this._attemptConnect(riderId, fallbackWsUrl, null)
      } else {
        this._attemptConnect(riderId, this.isUsingFallback ? fallbackWsUrl : WS_URL, fallbackWsUrl)
      }
    }, delay)
  }
}

export const socketService = new SocketService()
