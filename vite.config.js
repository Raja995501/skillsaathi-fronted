import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
      },
      '/ws': {
        target: 'ws://localhost:8080', // http ki jagah ws protocol for WebSocket
        ws: true,
        changeOrigin: true,
      }
    }
  }
})