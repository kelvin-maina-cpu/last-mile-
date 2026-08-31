// =============================================================================
// API CONFIGURATION — Centralized URL management
// =============================================================================
// Backend: http://localhost:3000
// Uses Vite proxy for /api paths → forwards to localhost:3000
// Socket.IO connects directly to ws://localhost:3000
// =============================================================================

const isDeployed =
  typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

// Primary URLs — the real backend
const PRIMARY_API_URL = import.meta.env.VITE_API_URL || null
const PRIMARY_WS_URL = import.meta.env.VITE_WS_URL || null

// Mock modes — only explicitly opt-in
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true'
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// Whether a primary backend is explicitly configured
export const HAS_PRIMARY_BACKEND = !!PRIMARY_API_URL

// =============================================================================
// DERIVED URLS
// =============================================================================
// API_BASE_URL:
//   - Local dev, no VITE_API_URL: '/api' (relative, goes through Vite proxy)
//   - Local dev, VITE_API_URL set: the primary backend URL (absolute)
//   - Production: the configured URL or null
//
// WS_URL: Socket.IO needs an absolute URL
//   - Local dev, no VITE_WS_URL: ws://localhost:3000 (real backend)
//   - Local dev, VITE_WS_URL set: the configured URL
//   - Production: the configured URL or null
// =============================================================================

export const API_BASE_URL = (() => {
  if (PRIMARY_API_URL) return PRIMARY_API_URL
  if (isDeployed) return null
  return '/api' // Local dev — Vite proxy forwards to localhost:3000
})()

export const WS_URL = PRIMARY_WS_URL || (isDeployed ? null : 'http://localhost:3001')

// =============================================================================
// FETCH WITH TIMEOUT
// =============================================================================

let _primaryBackendAvailable = HAS_PRIMARY_BACKEND

function isRelativeUrl(url) {
  return url.startsWith('/')
}

export async function apiFetch(endpoint, options = {}) {
  const baseUrl = API_BASE_URL

  if (!baseUrl) {
    console.warn('[API] No backend configured (VITE_API_URL not set)')
    throw new Error('No backend API URL configured. Set VITE_API_URL.')
  }

  // Relative URL — go through Vite proxy
  if (isRelativeUrl(baseUrl)) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, options, 10000)
      return response
    } catch (err) {
      console.warn('[API] Request failed via proxy:', err.message)
      throw err
    }
  }

  // Absolute URL — try primary
  const primaryUrl = `${baseUrl}${endpoint}`

  if (_primaryBackendAvailable) {
    try {
      const response = await fetchWithTimeout(primaryUrl, options, 10000)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }
      if (response.status >= 500) {
        console.warn('[API] Primary backend returned', response.status)
        _primaryBackendAvailable = false
      }
      return response
    } catch (err) {
      console.warn('[API] Primary backend unavailable:', err.message)
      _primaryBackendAvailable = false
      throw err
    }
  }

  throw new Error('Backend is unavailable')
}

// Reset primary availability
export function resetPrimaryBackendAvailability() {
  if (HAS_PRIMARY_BACKEND) {
    _primaryBackendAvailable = true
  }
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}
