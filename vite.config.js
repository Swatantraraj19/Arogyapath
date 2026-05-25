import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 🔄 Auto-update service worker in background when new version deploys
      registerType: 'autoUpdate',

      // 📦 Assets to include in the service worker pre-cache
      includeAssets: [
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],

      // 📄 Web App Manifest — defines how app looks when installed
      manifest: {
        name: 'ArogyaPath',
        short_name: 'ArogyaPath',
        description: 'AI-Powered Symptom Checker & Doctor Booking Platform',
        theme_color: '#059669',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable', // 🎭 Adaptive icon support for Android
          },
        ],
        screenshots: [
          {
            src: '/desktop_pwa.png',
            sizes: '1853x887',
            type: 'image/png',
            form_factor: 'wide',
            label: 'ArogyaPath Desktop Dashboard'
          },
          {
            src: '/mobile_pwa.png',
            sizes: '871x1600',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'ArogyaPath Mobile Interface'
          }
        ],
      },

      // ⚙️ Workbox strategy — cache app shell + static assets offline
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // ✅ Increase limit to 4MB to allow the ArogyaPath logo (2.19MB) to be cached
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Firebase Firestore API — always try network first
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cloudinary images — cache for faster load
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts — cache font files for offline
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})

