import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Adjust if your backend runs on a different port
        changeOrigin: true,
        // secure: false, // if using https with self-signed certificate
      }
    }
  }
})
