import { apiFetch, API_BASE_URL as PRIMARY_API, USE_MOCK_DATA } from '../../config/apiConfig'
import {
  getMockDeliveries,
  findMockDelivery,
  createMockDelivery,
  updateMockDeliveryStatus,
  completeMockDeliveryWithPOD,
  getMockRiders,
  assignMockRider,
} from './mockDeliveries'

// ============================================================
// Snake_case to camelCase converter for backend responses
// ============================================================
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function camelizeKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelizeKeys)
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [toCamelCase(key), camelizeKeys(value)])
    )
  }
  return obj
}

class DeliveryService {
  constructor() {
    // Legacy property kept for any direct access, but requests use apiFetch
    this.baseUrl = PRIMARY_API
    this._mockMode = USE_MOCK_DATA
  }

  // ============================================================
  // MOCK MODE — use when USE_MOCK_DATA=true or servers are down
  // ============================================================
  setMockMode(enabled) {
    this._mockMode = enabled
  }

  async request(endpoint, options = {}) {
    // If mock mode is active, route to mock data handlers
    if (this._mockMode) {
      return this._mockRequest(endpoint, options)
    }

    const token = localStorage.getItem('reflex_token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    }

    try {
      // Use the fallback-aware fetch
      const response = await apiFetch(endpoint, config)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new ApiError(
          error.error || `Request failed with status ${response.status}`,
          response.status,
          error
        )
      }

      const data = await response.json()
      return camelizeKeys(data)
    } catch (err) {
      // If server is unavailable, fall back to mock data
      console.warn('[DeliveryService] Server unavailable, falling back to mock data:', err.message)
      this._mockMode = true
      return this._mockRequest(endpoint, options)
    }
  }

  // Route mock requests to the appropriate mock function
  async _mockRequest(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase()

    // GET /deliveries
    if (endpoint === '/deliveries' && method === 'GET') {
      return getMockDeliveries()
    }

    // POST /deliveries
    if (endpoint === '/deliveries' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {}
      return createMockDelivery(body)
    }

    // GET /deliveries/:id
    const deliveryMatch = endpoint.match(/^\/deliveries\/([^/]+)$/)
    if (deliveryMatch && method === 'GET') {
      return findMockDelivery(deliveryMatch[1])
    }

    // PATCH /deliveries/:id/status
    const statusMatch = endpoint.match(/^\/deliveries\/([^/]+)\/status$/)
    if (statusMatch && method === 'PATCH') {
      const body = options.body ? JSON.parse(options.body) : {}
      return updateMockDeliveryStatus(statusMatch[1], body.status)
    }

    // POST /deliveries/:id/assign
    const assignMatch = endpoint.match(/^\/deliveries\/([^/]+)\/assign$/)
    if (assignMatch && method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {}
      return assignMockRider(assignMatch[1], body.riderId)
    }

    // POST /deliveries/:id/complete
    const completeMatch = endpoint.match(/^\/deliveries\/([^/]+)\/complete$/)
    if (completeMatch && method === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {}
      return completeMockDeliveryWithPOD(completeMatch[1], body)
    }

    // GET /riders
    if (endpoint === '/riders' && method === 'GET') {
      return getMockRiders()
    }

    // GET /riders/:riderId/deliveries
    const riderDeliveriesMatch = endpoint.match(/^\/riders\/([^/]+)\/deliveries$/)
    if (riderDeliveriesMatch && method === 'GET') {
      return getMockDeliveries(riderDeliveriesMatch[1])
    }

    // Unknown endpoint in mock mode
    console.warn('[DeliveryService] Mock mode: no mock handler for', method, endpoint)
    throw new ApiError(`Mock mode: ${method} ${endpoint} not implemented`, 501)
  }

  // ============================================================
  // RETAILER: Create a new delivery
  // ============================================================
  async createDelivery(deliveryData) {
    const delivery = await this.request('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    })
    return delivery
  }

  // ============================================================
  // DISPATCHER: Get all deliveries
  // ============================================================
  async getDeliveries() {
    const data = await this.request('/deliveries')
    return Array.isArray(data) ? data : []
  }

  // ============================================================
  // DISPATCHER: Get available riders
  // ============================================================
  async getAvailableRiders() {
    const data = await this.request('/riders')
    return Array.isArray(data) ? data : []
  }

  // ============================================================
  // DISPATCHER: Assign a rider to a delivery
  // ============================================================
  async assignRider(deliveryId, riderId) {
    const delivery = await this.request(`/deliveries/${deliveryId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ riderId }),
    })
    return delivery
  }

  // ============================================================
  // RIDER: Get assigned deliveries
  // ============================================================
  async getAssignedDeliveries(riderId) {
    const data = await this.request(`/riders/${riderId}/deliveries`)
    return Array.isArray(data) ? data : []
  }

  // ============================================================
  // GET single delivery by ID
  // ============================================================
  async getDeliveryById(deliveryId) {
    const delivery = await this.request(`/deliveries/${deliveryId}`)
    return delivery
  }

  // ============================================================
  // RIDER: Complete delivery with Proof of Delivery
  // ============================================================
  async completeDeliveryWithPOD(deliveryId, podData) {
    const delivery = await this.request(`/deliveries/${deliveryId}/complete`, {
      method: 'POST',
      body: JSON.stringify(podData),
    })
    return delivery
  }

  // ============================================================
  // Update delivery status (rider action)
  // ============================================================
  async updateDeliveryStatus(deliveryId, status) {
    const delivery = await this.request(`/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return delivery
  }

  // ============================================================
  // DELETE delivery
  // ============================================================
  async deleteDelivery(deliveryId) {
    await this.request(`/deliveries/${deliveryId}`, {
      method: 'DELETE',
    })
  }
}

class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const deliveryService = new DeliveryService()
export { ApiError }
