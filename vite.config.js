import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Di Vercel, frontend di-root, jadi base '/' sudah tepat.
  // Jika ingin ditaruh di subdirektori, ubah base.
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3000,
    // Proxy endpoint API agar saat development (vite dev) fetch ke /api tetap jalan
    // tanpa CORS. Di Vercel production, ini tidak dipakai karena API ada di /api/.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
