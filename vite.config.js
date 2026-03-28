import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Monash-Course-Planner/', // Update this to match your GitHub repo name
  server: {
    proxy: {
      '/handbook-proxy': {
        target: 'https://handbook.monash.edu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/handbook-proxy/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
  },
})
