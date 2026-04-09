import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'asset-logix.local',
    port: 5173,
    strictPort: true,
    allowedHosts: ['asset-logix.local']
  }
})
