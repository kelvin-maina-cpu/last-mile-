const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ============================================================
// TEMPORARY MOCK DATA MODE (Mary, Rider frontend) — see mockDeliveries.js
// ============================================================
import { getMockDeliveries, findMockDelivery, updateMockDeliveryStatus, createMockDelivery, getMockRiders, assignMockRider, completeMockDeliveryWithPOD } from './mockDeliveries'

// Turn mock mode on/off with VITE_USE_MOCK_DATA=true|false in
// frontend/.env (see .env.example). When explicitly enabled, mock
// data is used unconditionally — no real requests are attempted.
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

class DeliveryService {
  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
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
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new ApiError(
          error.message || `Request failed with status ${response.status}`,
          response.status,
          error
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Network error. Please check your connection.', 0)
    }
  }

  // ============================================================
  // RETAILER: Create a new delivery
  // ============================================================
  async createDelivery(deliveryData) {
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      return createMockDelivery(deliveryData)
    }

    const response = await this.request('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    })
    return response.delivery
  }

  // ============================================================
  // DISPATCHER: Get all deliveries
  // ============================================================
  async getDeliveries() {
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      return getMockDeliveries()
    }

    const response = await this.request('/deliveries')
    return response.deliveries
  }

  // ============================================================
  // DISPATCHER: Get available riders
  // ============================================================
  async getAvailableRiders() {
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      return getMockRiders()
    }

    const response = await this.request('/riders')
    return response.riders
  }

  // ============================================================
  // DISPATCHER: Assign a rider to a delivery
  // ============================================================
  async assignRider(deliveryId, riderId) {
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      return assignMockRider(deliveryId, riderId)
    }

    const response = await this.request(`/deliveries/${deliveryId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ riderId }),
    })
    return response.delivery
  }

  // ============================================================
  // RIDER: Get assigned deliveries
  // ============================================================
  async getAssignedDeliveries(riderId) {
    // MOCK MODE: explicit override — always serve mock data.
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      return getMockDeliveries(riderId)
    }

    try {
      return await this.request(`/riders/${riderId}/deliveries`)
    } catch (error) {
      // MOCK MODE: dev-only automatic fallback, and ONLY when the
      // backend could not be reached at all (network error, status 0
      // from the catch block below) — a real HTTP 4xx/5xx from a
      // running backend is NOT masked, so the existing error-banner /
      // retry UI stays testable against a real, erroring backend.
      if (import.meta.env.DEV && error instanceof ApiError && error.status === 0) {
        console.warn('[mock] Backend unreachable — serving mock deliveries. Start the backend or set VITE_USE_MOCK_DATA=false to see real errors instead.')
        return getMockDeliveries(riderId)
      }
      throw error
    }
  }

  async getDeliveryById(deliveryId) {
    // MOCK MODE: explicit override — always serve mock data.
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      const delivery = await findMockDelivery(deliveryId)
      if (!delivery) {
        throw new ApiError('Delivery not found', 404)
      }
      return delivery
    }

    try {
      const response = await this.request(`/deliveries/${deliveryId}`)
      return response.delivery
    } catch (error) {
      if (import.meta.env.DEV && error instanceof ApiError && error.status === 0) {
        console.warn('[mock] Backend unreachable — serving mock delivery. Start the backend or set VITE_USE_MOCK_DATA=false to see real errors instead.')
        const delivery = await findMockDelivery(deliveryId)
        if (!delivery) {
          throw new ApiError('Delivery not found', 404)
        }
        return delivery
      }
      throw error
    }
  }

  // ============================================================
  // RIDER: Complete delivery with Proof of Delivery
  // ============================================================
  async completeDeliveryWithPOD(deliveryId, podData) {
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      const updated = await completeMockDeliveryWithPOD(deliveryId, podData)
      if (!updated) {
        throw new ApiError('Delivery not found', 404)
      }
      return updated
    }

    const response = await this.request(`/deliveries/${deliveryId}/complete`, {
      method: 'POST',
      body: JSON.stringify(podData),
    })
    return response.delivery
  }

  // ============================================================
  // Update delivery status (rider action)
  // ============================================================
  async updateDeliveryStatus(deliveryId, status) {
    // MOCK MODE: explicit override — always serve mock data.
    if (USE_MOCK_AUTH || USE_MOCK_DATA) {
      const updated = await updateMockDeliveryStatus(deliveryId, status)
      if (!updated) {
        throw new ApiError('Delivery not found', 404)
      }
      return updated
    }

    try {
      const response = await this.request(`/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      return response.delivery
    } catch (error) {
      if (import.meta.env.DEV && error instanceof ApiError && error.status === 0) {
        console.warn('[mock] Backend unreachable — applying status update to mock data. Start the backend or set VITE_USE_MOCK_DATA=false to see real errors instead.')
        const updated = await updateMockDeliveryStatus(deliveryId, status)
        if (!updated) {
          throw new ApiError('Delivery not found', 404)
        }
        return updated
      }
      throw error
    }
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