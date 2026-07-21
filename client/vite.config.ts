import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',

  build: {
    outDir:   'dist',
    sourcemap: false,
    minify:   'esbuild',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Fine-grained chunking — each heavy lib gets its own cached file
        manualChunks(id) {
          // Core React runtime
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor';
          }
          // Charts — heavy, rarely changes
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // Animations — heavy, rarely changes
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          // Maps — very heavy, only used on map page
          if (id.includes('node_modules/leaflet') ||
              id.includes('node_modules/react-leaflet')) {
            return 'maps';
          }
          // Form libraries
          if (id.includes('node_modules/react-hook-form')) {
            return 'forms';
          }
          // Zustand state management
          if (id.includes('node_modules/zustand')) {
            return 'state';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'dates';
          }
          // UI utilities
          if (id.includes('node_modules/lucide-react') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/@headlessui')) {
            return 'ui-utils';
          }
          // Socket.io — only needed when authenticated
          if (id.includes('node_modules/socket.io-client') ||
              id.includes('node_modules/engine.io-client')) {
            return 'realtime';
          }
          // Axios HTTP client
          if (id.includes('node_modules/axios')) {
            return 'http';
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
