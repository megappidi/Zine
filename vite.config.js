import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('/react/') ||
            id.includes('\\react\\') ||
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            id.includes('jotai')
          ) {
            return 'react-vendor';
          }

          if (
            id.includes('three') ||
            id.includes('@react-three') ||
            id.includes('maath')
          ) {
            return 'three-vendor';
          }

          if (id.includes('motion') || id.includes('framer-motion')) {
            return 'motion-vendor';
          }
        },
      },
    },
  },
})
