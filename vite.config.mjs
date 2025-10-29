import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PUBLIC_HOST = process.env.PUBLIC_HOST || undefined

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // espone su 0.0.0.0
    port: 5173,
    strictPort: false,
    watch: {
      ignored: ['**/dist/**', '**/node_modules/**', '**/.git/**']
    },
    hmr: {
      protocol: 'wss',        // usa WSS quando il proxy termina TLS
      host: PUBLIC_HOST,      // se undefined, Vite userà default (utile in LAN)
      clientPort: 443         // porta pubblica HTTPS/WSS del proxy
    }
  }
})