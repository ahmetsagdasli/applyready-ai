import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend 5173'te calisir, /api istekleri backend'e (5001) proxy'lenir.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Buyuk vendor'lari ayri chunk'a al: uygulama kodu degisince
        // kullanicinin cache'indeki vendor chunk gecerli kalir.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
