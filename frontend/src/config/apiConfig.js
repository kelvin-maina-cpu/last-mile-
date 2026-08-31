// =============================================================================
// API CONFIGURATION — Centralized URL management with fallback support
// =============================================================================
//
// Primary backend: the REAL backend (API, auth, database, WebSocket).
// Fallback server: frontend/server — used only when primary is unreachable.
//
// Environment variables:
//   VITE_API_URL          — Primary backend API URL
//                           Production: https://REAL-BACKEND-DOMAIN/api
//                           Local dev (real backend): http://localhost:REAL_PORT/api
//                           Local dev (fallback only): leave UNSET → uses /api (Vite proxy)
//   VITE_WS_URL           — Primary backend WebSocket URL
//                           Production: wss://REAL-BACKEND-DOMAIN
//                           Local dev: ws://localhost:REAL_PORT
//   VITE_FALLBACK_API_URL — Fallback server API URL (default: http://localhost:3001/api)
//   VITE_FALLBACK_WS_URL  — Fallback server WebSocket URL (default: ws://localhost:3001)
//   VITE_USE_MOCK_AUTH    — Force mock auth mode (default: false)
//   VITE_USE_MOCK_DATA    — Force mock delivery data mode (default: false)
//
// =============================================================================
// IMPORTANT: How local dev works
// =============================================================================
//
// When VITE_API_URL is NOT set (local dev, fallback-only mode):
//   apiFetch uses RELATIVE URLs (e.g. /api/deliveries)
//   → Browser sends request to http://localhost:5173/api/deliveries
//   → Vite dev server proxy forwards to http://localhost:3001/api/deliveries
//   → This requires the fallback server to be running on port 3001
//
// When VITE_API_URL IS set (local dev with real backend, or production):
//   apiFetch uses ABSOLUTE URLs (e.g. http://localhost:4000/api/deliveries)
//   → Browser sends directly to the real backend
//   → If the real backend is unreachable, apiFetch falls back to the fallback server
//
// When VITE_WS_URL is set:
//   WebSocket connects directly to the configured URL (WS never goes through proxy)
// =============================================================================

const isDeployed =
  typeof window !== 'undefined' &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1')

// Primary URLs — the real backend (null if not configured)
const PRIMARY_API_URL = import.meta.env.VITE_API_URL || null
const PRIMARY_WS_URL = import.meta.env.VITE_WS_URL || null

// Fallback URLs — frontend/server (localhost:3001)
export const FALLBACK_API_URL =
  import.meta.env.VITE_FALLBACK_API_URL || 'http://localhost:3001/api'
export const FALLBACK_WS_URL =
  import.meta.env.VITE_FALLBACK_WS_URL || 'ws://localhost:3001'

// Mock modes — only explicitly opt-in
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true'
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// Whether a primary backend is explicitly configured
export const HAS_PRIMARY_BACKEND = !!PRIMARY_API_URL

// =============================================================================
// DERIVED URLS
// =============================================================================
// API_BASE_URL: used for OAuth redirects and other absolute-URL needs.
//   - Local dev, no VITE_API_URL: '/api' (relative, goes through Vite proxy)
//   - Local dev, VITE_API_URL set: the primary backend URL (absolute)
//   - Production, VITE_API_URL set: the primary backend URL (absolute)
//   - Production, no VITE_API_URL: null (no backend available)
//
// WS_URL: WebSocket always needs an absolute URL (browsers can't proxy WS).
//   - Local dev, no VITE_WS_URL: ws://localhost:3001 (fallback WS server)
//   - Local dev, VITE_WS_URL set: the primary WS URL
//   - Production: the configured WS URL or null
// =============================================================================

export const API_BASE_URL = (() => {
  if (PRIMARY_API_URL) return PRIMARY_API_URL
  // No primary configured:
  if (isDeployed) return null // Production without backend — no URL available
  return '/api' // Local dev — relative URL, Vite proxy handles routing
})()

export const WS_URL = PRIMARY_WS_URL || (isDeployed ? null : FALLBACK_WS_URL)

// =============================================================================
// FETCH WITH FALLBACK
// =============================================================================
// - If API_BASE_URL is relative (local dev, no primary): fetch directly (proxy handles it)
// - If API_BASE_URL is absolute (primary configured): try primary, fall back to fallback
// =============================================================================

let _primaryBackendAvailable = HAS_PRIMARY_BACKEND

function isRelativeUrl(url) {
  return url.startsWith('/')
}

export async function apiFetch(endpoint, options = {}) {
  const baseUrl = API_BASE_URL

  // No backend at all (production without VITE_API_URL)
  // Throw so callers can fall back to mock data
  if (!baseUrl) {
    console.warn('[API] No backend configured (VITE_API_URL not set) — caller should use mock data')
    throw new Error('No backend API URL configured. Caller should fall back to mock data.')
  }

  // Relative URL — go through Vite proxy (local dev, no primary backend)
  if (isRelativeUrl(baseUrl)) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, options, 10000)
      return response
    } catch (err) {
      console.warn('[API] Request failed via proxy:', err.message)
      // In local dev with no primary, there's no fallback to try — the proxy
      // IS the routing layer. If it fails, the server on port 3001 is down.
      throw err
    }
  }

  // Absolute URL — try primary, fall back to fallback server
  const primaryUrl = `${baseUrl}${endpoint}`
  const fallbackFullUrl = `${FALLBACK_API_URL}${endpoint}`

  if (_primaryBackendAvailable) {
    try {
      const response = await fetchWithTimeout(primaryUrl, options, 10000)
      // Successful or client error (4xx) — use primary
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }
      // 5xx — primary backend is struggling, try fallback
      if (response.status >= 500) {
        console.warn('[API] Primary backend returned', response.status, '— attempting fallback')
        _primaryBackendAvailable = false
        return tryFallback(fallbackFullUrl, options)
      }
      return response
    } catch (err) {
      console.warn('[API] Primary backend unavailable:', err.message)
      console.log('[API] Using fallback server')
      _primaryBackendAvailable = false
      return tryFallback(fallbackFullUrl, options)
    }
  }

  // Primary previously failed — go straight to fallback
  console.log('[API] Using fallback server (primary was previously unavailable)')
  return tryFallback(fallbackFullUrl, options)
}

// Reset primary availability (e.g., on app restart or periodic health check)
export function resetPrimaryBackendAvailability() {
  if (HAS_PRIMARY_BACKEND) {
    _primaryBackendAvailable = true
  }
}

async function tryFallback(url, options) {
  try {
    const response = await fetchWithTimeout(url, options, 5000)
    return response
  } catch (err) {
    console.warn('[API] Fallback server also unavailable:', err.message)
    console.warn('[API] Caller should fall back to mock data')
    throw new Error('Both primary and fallback servers are unavailable')
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
