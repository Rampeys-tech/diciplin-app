import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Diciplin-logo.png', 'robots.txt'],
      manifest: {
        name: 'Diciplin.com - Crew Attendance',
        short_name: 'Diciplin.com',
        description: 'Sistem Presensi & Manajemen Kedisiplinan Kru Outlet',
        theme_color: '#4F46E5',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [
          {
            src: '/Diciplin-logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/Diciplin-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});