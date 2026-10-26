import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cold-chain-integrity-monitoring/',
  server: {
    port: 3000,
    open: true
  }
})