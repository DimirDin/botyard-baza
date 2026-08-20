import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // порт берётся из окружения, если задан — 5173 бывает занят другим локальным сервисом
    port: Number(process.env.PORT) || 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3015",
        changeOrigin: true,
      },
    },
  },
})
