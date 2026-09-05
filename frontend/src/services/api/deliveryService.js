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
      body: JSON.stringify({
        ...deliveryData,
        address: deliveryData.deliveryAddress,
      }),
    })
    return normalizeDelivery(response.delivery || response)
  }

  // ============================================================
  // DISPATCHER: Get all deliveries
  // GET /api/deliveries?status=REQUESTED
  // ============================================================
  async getDeliveries(status) {
    const query = status ? `?status=${status}` : ''
    const response = await this.request(`/deliveries${query}`)
    // Backend returns { deliveries: [...] }
    return (response.deliveries || response || []).map(normalizeDelivery)
  }

  // ============================================================
  // RIDER: Get deliveries assigned to this rider
  // GET /api/deliveries/rider/:riderId
  // ============================================================
  async getAssignedDeliveries(riderId) {
    try {
      const response = await this.request(`/deliveries/rider/${riderId}`)
      return (response.deliveries || response || []).map(normalizeDelivery)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      const response = await this.request(`/riders/${riderId}/deliveries`)
      return (response.deliveries || response || []).map(normalizeDelivery)
    }
  }

  // ============================================================
  // GET single delivery by ID
  // GET /api/deliveries/:id
  // ============================================================
  async getDeliveryById(deliveryId) {
    const response = await this.request(`/deliveries/${deliveryId}`)
    // Backend returns { delivery: {...} }
    return normalizeDelivery(response.delivery || response)
  }

  // ============================================================
  // DISPATCHER: Get all riders
  // GET /api/riders?available=true
  // ============================================================
  async getRiders(available) {
    const query = available !== undefined ? `?available=${available}` : ''
    const response = await this.request(`/riders${query}`)
    // Backend returns { riders: [...] }
    return response.riders || response || []
  }

  async getRiderByUserId(userId) {
    const response = await this.request(`/riders?userId=${encodeURIComponent(userId)}`)
    const riders = response.riders || response || []
    return riders[0] || null
  }

  async getAvailableRiders() {
    return this.getRiders(true)
  }

  // ============================================================
  // DISPATCHER: Assign a rider to a delivery
  // PATCH /api/deliveries/:id/assign
  // ============================================================
  async assignRider(deliveryId, riderId) {
    const options = { body: JSON.stringify({ riderId }) }
    try {
      const response = await this.request(`/deliveries/${deliveryId}/assign`, {
        ...options,
        method: 'PATCH',
      })
      return normalizeDelivery(response.delivery || response)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      const response = await this.request(`/deliveries/${deliveryId}/assign`, {
        ...options,
        method: 'POST',
      })
      return normalizeDelivery(response.delivery || response)
    }
  }

  // ============================================================
  // RIDER: Update delivery status
  // PATCH /api/deliveries/:id/status
  // Allowed values: PICKED_UP, DELIVERED
  // ============================================================
  async updateDeliveryStatus(deliveryId, status, riderId) {
    const response = await this.request(`/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(riderId ? { riderId } : {}) }),
    })
    // Backend returns { delivery: {...} }
    return normalizeDelivery(response.delivery || response)
  }

  async completeDelivery(deliveryId, proof) {
    const response = await this.request(`/deliveries/${deliveryId}/complete`, {
      method: 'POST',
      body: JSON.stringify(proof),
    })
    return normalizeDelivery(response.delivery || response)
  }

  async submitRating(riderId, deliveryId, rating, comment) {
    const response = await this.request(`/riders/${riderId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ deliveryId, rating, comment }),
    })
    return response
  }

  // ============================================================
  // HELPER: Make API request
  // ============================================================
  async request(endpoint, options = {}) {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('reflex_token')
      : null
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

function normalizeDelivery(delivery) {
  if (!delivery) return delivery
  return {
    ...delivery,
    id: delivery.id || delivery._id,
    customerName: delivery.customerName || delivery.customer_name,
    customerPhone: delivery.customerPhone || delivery.customer_phone,
    customerId: delivery.customerId || delivery.customer_id,
    deliveryAddress: delivery.deliveryAddress || delivery.address,
    itemDescription: delivery.itemDescription || delivery.item_description,
    riderId: delivery.riderId || delivery.rider_id,
    proofOfDelivery: delivery.proofOfDelivery || delivery.proof_of_delivery,
    status: delivery.status === 'OPEN' ? 'REQUESTED' : delivery.status,
  }
}
