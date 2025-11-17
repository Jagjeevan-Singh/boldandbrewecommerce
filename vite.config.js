import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to Firebase Functions emulator or deployed functions.
      // Frontend should call /api/<functionName> and this proxy will forward to the functions host.
      '/api': {
        target: 'http://localhost:5001/local-bandb/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    // Increase chunk size warning threshold (in kB)
    chunkSizeWarningLimit: 1024
  }
})
