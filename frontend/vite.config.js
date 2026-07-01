import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }, // <--- Added the missing closing brace here
  build: {
    sourcemap: true,
  },
}); // <--- Correctly closed the defineConfig function