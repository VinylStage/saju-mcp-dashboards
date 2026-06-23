import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          chartjs: ['chart.js'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
});
