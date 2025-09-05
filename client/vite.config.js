import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    mkcert(), // ✅ add mkcert
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    https: true,       // ✅ enable HTTPS
    host: 'localhost',
    port: 5173,
    proxy: {
      // 👇 optional: proxy API calls to backend so no CORS headaches
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
