import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative base so GitHub Pages works in sub-paths (e.g. /Test_monitor/) without hardcoding
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-firestore': ['firebase/firestore']
        }
      }
    },
    chunkSizeWarningLimit: 700
  }
})
