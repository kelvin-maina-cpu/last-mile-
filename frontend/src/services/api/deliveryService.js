const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ============================================================
// TEMPORARY MOCK DATA MODE (Mary, Rider frontend) — see mockDeliveries.js
// ============================================================
// Everything in this block/marked "MOCK MODE" below is temporary UI
// dev tooling, not part of the real API contract. To remove later:
// delete mockDeliveries.js and the blocks marked "MOCK MODE" in this
// file. The real fetch-based request path below is untouched and
// remains the production path.
import { getMockDeliveries, findMockDelivery, updateMockDeliveryStatus } from './mockDeliveries'

// Turn mock mode on/off with VITE_USE_MOCK_DATA=true|false in
// frontend/.env (see .env.example). When explicitly enabled, mock
// data is used unconditionally — no real requests are attempted.
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

class DeliveryService {
  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
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

  async getAssignedDeliveries(riderId) {
    // MOCK MODE: explicit override — always serve mock data.
    if (USE_MOCK_DATA) {
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
    if (USE_MOCK_DATA) {
      const delivery = await findMockDelivery(deliveryId)
      if (!delivery) {
        throw new ApiError('Delivery not found', 404)
      }
      return delivery
    }

    try {
      return await this.request(`/deliveries/${deliveryId}`)
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

  async updateDeliveryStatus(deliveryId, status) {
    // MOCK MODE: explicit override — always serve mock data.
    if (USE_MOCK_DATA) {
      const updated = await updateMockDeliveryStatus(deliveryId, status)
      if (!updated) {
        throw new ApiError('Delivery not found', 404)
      }
      return updated
    }

    try {
      return await this.request(`/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
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