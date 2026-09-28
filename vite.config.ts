import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { buildStamp } from './scripts/build-stamp.ts'

export default defineConfig({
  // Cadence lives at https://spyobird.github.io/cadence/ for good (ADR 0001)
  base: '/cadence/',
  define: {
    __BUILD__: JSON.stringify(buildStamp()),
  },
  server: { host: true, allowedHosts: true },
  build: {
    // One bundle, so a page running old code never asks for a chunk the new service worker dropped
    rolldownOptions: { output: { codeSplitting: false } },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Registered once, in main.tsx. No injectRegister: 'script' (it turns off skipWaiting and clientsClaim)
      registerType: 'autoUpdate',
      includeManifestIcons: false, // globPatterns already precaches them
      manifest: {
        id: '/cadence/',
        name: 'Cadence',
        short_name: 'Cadence',
        description: 'Two Quests a Quarter, and a place to reflect on them',
        start_url: '/cadence/',
        scope: '/cadence/',
        display: 'standalone',
        // The manifest holds one colour; the head carries both looks
        theme_color: '#0F1113',
        background_color: '#0F1113',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
})
