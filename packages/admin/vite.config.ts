import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// API target for proxy - uses Docker service name in container, localhost otherwise
const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@marcomarchione/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external connections in Docker
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      // Proxy only actual media files (with year/month path), not the /media route
      '^/media/\\d{4}/': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
