import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/generate_link_token': 'http://localhost:8080',
      '/swap_public_token': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    }
  }
})
