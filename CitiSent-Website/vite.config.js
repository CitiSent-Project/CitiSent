import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('framer-motion')) {
            return 'motion-vendor'
          }

          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'charts-vendor'
          }

          if (
            id.includes('react-hot-toast') ||
            id.includes('react-icons')
          ) {
            return 'ui-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
