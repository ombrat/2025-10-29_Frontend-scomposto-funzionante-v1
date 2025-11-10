import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PUBLIC_HOST = process.env.PUBLIC_HOST || undefined

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // espone su 0.0.0.0
    port: 5173,        // ← Riportata a 5173
    strictPort: false,
    watch: {
      ignored: ['**/dist/**', '**/node_modules/**', '**/.git/**']
    },
    hmr: {
      protocol: 'wss',        // usa WSS quando il proxy termina TLS
      host: PUBLIC_HOST,      // se undefined, Vite userà default (utile in LAN)
      clientPort: 443         // porta pubblica HTTPS/WSS del proxy
    },
    // Proxy per backend services (risolve problemi CORS)
    proxy: {
      '/api/news': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📰 Proxying NEWS request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ NEWS proxy response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.log('❌ NEWS proxy error:', err.message);
          });
        }
      }
    }
  }
})