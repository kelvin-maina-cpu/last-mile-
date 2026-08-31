import { apiFetch, API_BASE_URL as PRIMARY_API, HAS_PRIMARY_BACKEND } from '../../config/apiConfig'

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
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('reflex_token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    }

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
