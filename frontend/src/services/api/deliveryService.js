import { apiFetch } from '../../config/apiConfig'

// ============================================================
// API Service Layer — matches backend API contract
// ============================================================
// Backend: http://localhost:3000
// All endpoints return { delivery: {...} } or { deliveries: [...] } or { riders: [...] }
// ============================================================

class DeliveryService {
  // ============================================================
  // HEALTH CHECK
  // ============================================================
  async healthCheck() {
    const response = await this.request('/health')
    return response
  }

  // ============================================================
  // RETAILER: Create a new delivery
  // POST /api/deliveries
  // ============================================================
  async createDelivery(deliveryData) {
    const response = await this.request('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    })
    // Backend returns { delivery: {...} }
    return response.delivery
  }

  // ============================================================
  // DISPATCHER: Get all deliveries
  // GET /api/deliveries?status=REQUESTED
  // ============================================================
  async getDeliveries(status) {
    const query = status ? `?status=${status}` : ''
    const response = await this.request(`/deliveries${query}`)
    // Backend returns { deliveries: [...] }
    return response.deliveries || []
  }

  // ============================================================
  // RIDER: Get deliveries assigned to this rider
  // GET /api/deliveries/rider/:riderId
  // ============================================================
  async getAssignedDeliveries(riderId) {
    const response = await this.request(`/deliveries/rider/${riderId}`)
    return response.deliveries || []
  }

  // ============================================================
  // GET single delivery by ID
  // GET /api/deliveries/:id
  // ============================================================
  async getDeliveryById(deliveryId) {
    const response = await this.request(`/deliveries/${deliveryId}`)
    // Backend returns { delivery: {...} }
    return response.delivery
  }

  // ============================================================
  // DISPATCHER: Get all riders
  // GET /api/riders?available=true
  // ============================================================
  async getRiders(available) {
    const query = available !== undefined ? `?available=${available}` : ''
    const response = await this.request(`/riders${query}`)
    // Backend returns { riders: [...] }
    return response.riders || []
  }

  async getAvailableRiders() {
    return this.getRiders(true)
  }

  // ============================================================
  // DISPATCHER: Assign a rider to a delivery
  // PATCH /api/deliveries/:id/assign
  // ============================================================
  async assignRider(deliveryId, riderId) {
    const response = await this.request(`/deliveries/${deliveryId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ riderId }),
    })
    // Backend returns { delivery: {...} }
    return response.delivery
  }

  // ============================================================
  // RIDER: Update delivery status
  // PATCH /api/deliveries/:id/status
  // Allowed values: PICKED_UP, DELIVERED
  // ============================================================
  async updateDeliveryStatus(deliveryId, status) {
    const response = await this.request(`/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    // Backend returns { delivery: {...} }
    return response.delivery
  }

  // ============================================================
  // HELPER: Make API request
  // ============================================================
  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await apiFetch(endpoint, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(
        error.error || `Request failed with status ${response.status}`,
        response.status,
        error.code || 'UNKNOWN_ERROR',
        error.details
      )
    }

    return response.json()
  }
}

class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const deliveryService = new DeliveryService()
export { ApiError }
