import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        }
      }
    },
    // SEO uchun muhim
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild'
  },
  // SEO uchun server sozlamalari
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
});
