import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In local dev with no VITE_API_URL, apiFetch uses relative /api paths.
      // The Vite proxy forwards these to the fallback server (localhost:3001).
      // When VITE_API_URL IS set, apiFetch uses absolute URLs and bypasses
      // the proxy entirely — this target is unused in that case.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})