import { io } from 'socket.io-client'
import { WS_URL } from '../../config/apiConfig'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.connectionState = 'disconnected'
  }

  connect() {
    if (this.socket?.connected) {
      return
    }

    this.connectionState = 'connecting'

    if (!WS_URL) {
      throw new Error('No websocket URL configured. Set VITE_API_URL or VITE_WS_URL.')
    }

    const url = WS_URL

    this.socket = io(url, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.socket.on('connect', () => {
      this.connectionState = 'connected'
      this._emit('connectionChange', { state: 'connected' })
    })

    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected'
      this._emit('connectionChange', { state: 'disconnected' })
    })

    this.socket.on('connect_error', (error) => {
      this.connectionState = 'error'
      this._emit('connectionChange', { state: 'error' })
    })

    this.socket.on('reconnect_attempt', (attempt) => {
      this.connectionState = 'reconnecting'
      this._emit('connectionChange', { state: 'reconnecting', attempt })
    })

    this.socket.on('reconnect', () => {
      this.connectionState = 'connected'
      this._emit('connectionChange', { state: 'connected' })
    })

    // Listen for backend events and forward to our listeners
    this.socket.on('delivery:created', (data) => {
      this._emit('delivery:created', data)
    })

    this.socket.on('delivery:assigned', (data) => {
      this._emit('delivery:assigned', data)
    })

    this.socket.on('delivery:status-updated', (data) => {
      this._emit('delivery:status-updated', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
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
}

export const socketService = new SocketService()
