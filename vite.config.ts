import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  define: {
    // Exposed to the app (see src/vite-env.d.ts). npm sets npm_package_version
    // during `npm run dev` / `npm run build`.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  server: { port: 5181, strictPort: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'MyRadl – MTB Manager',
        short_name: 'MyRadl',
        description: 'Verwalte deine Mountainbikes, Bauteile und Einstellungen.',
        theme_color: '#12100E',
        background_color: '#12100E',
        display: 'standalone',
        orientation: 'portrait',
        id: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // Never precache Supabase API/storage responses — they are user-specific
        // and must stay fresh; let them hit the network (runtime, not cached).
        navigateFallbackDenylist: [/^\/api/, /supabase/],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
