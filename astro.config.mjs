// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";
import AstroPWA from "@vite-pwa/astro";

// Bearings — static, self-contained, privacy-forward.
// Blocking Decision 3: SSG, no server, no third-party scripts.
// Blocking Decision 1: offline-first is a v1 requirement.
export default defineConfig({
  site: "https://bearings.example",
  output: "static",
  trailingSlash: "never",
  build: {
    inlineStylesheets: "never", // predictable CSP; no inline <style> to allow
  },
  /* Per-page CSP meta tag with hashes for every inline script the
     build emits (theme no-flash, NightField, Astro hydration).
     Without these hashes the strict header CSP (public/_headers)
     blocks every inline script and the whole app goes dead.
     public/_headers delegates script-src/style-src to this meta. */
  security: {
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        "connect-src 'self'",
        "img-src 'self' data:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "manifest-src 'self'",
      ],
      /* Hashes for the two <script is:inline> blocks (theme no-flash
         in BaseLayout, NightField canvas) — Astro hashes bundled and
         hydration scripts itself, but not is:inline ones, and an
         unhased inline script is a blocked inline script under the
         strict CSP. If you edit either script, recompute these with
         `bun run csp:hashes`; scripts/check-csp.js fails the release
         gate if the built pages drift from them. */
      scriptDirective: {
        hashes: [
          "sha256-GkT1OSEwrRrZ/se3iToF/u5pOvcp5uVl51aURuI8Y9k=",
          "sha256-HExMRMooOWE+B3fdjWsX8+XmO///uhVhIZkmVq5in2U=",
        ],
      },
    },
  },
  integrations: [
    svelte(),
    sitemap(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Bearings",
        short_name: "Bearings",
        description:
          "A place to get your bearings. Explore what feels useful today.",
        theme_color: "#050507",
        background_color: "#050507",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,ico}"],
        maximumFileSizeToCacheInBytes: 4194304,
        // Blocking Decision: safety content cache-first (works offline),
        // crisis-referral data network-first (freshest number reaches user).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/safety"),
            handler: "CacheFirst",
            options: {
              cacheName: "safety-content",
              expiration: { maxEntries: 50 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/referrals"),
            handler: "NetworkFirst",
            options: {
              cacheName: "crisis-referrals",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // avoid SW caching surprises during development
      },
    }),
  ],
});
