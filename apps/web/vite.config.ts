import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32x32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Stólpi — Rekstrarkerfi",
        short_name: "Stólpi",
        description: "Birgðir, verkefni, sala og samningar fyrir Stólpi leigueiningar.",
        start_url: "/",
        display: "standalone",
        background_color: "#f2f2f3",
        theme_color: "#5980a6",
        lang: "is",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      // App shell only — API responses aren't cached, so the office app always shows live data
      // when online. Offline just means the shell loads instead of a network error.
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
