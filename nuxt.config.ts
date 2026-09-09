// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  runtimeConfig: {
    sanityProjectId:            process.env.NUXT_SANITY_PROJECT_ID               ?? '',
    sanityDataset:              process.env.NUXT_SANITY_DATASET                   ?? 'production',
    sanityToken:                process.env.NUXT_SANITY_TOKEN                     ?? '',
    resendApiKey:               process.env.NUXT_RESEND_API_KEY                   ?? '',
    mailerFrom:                 process.env.NUXT_MAILER_FROM                      ?? 'lyoraeth.art <hello@lyoraeth.art>',
    mailerTo:                   process.env.NUXT_MAILER_TO                        ?? '',
    turnstileContactSecretKey:  process.env.NUXT_TURNSTILE_SECRET_KEY_CONTACT     ?? '',
    public: {
      turnstileContactSiteKey:  process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY_CONTACT ?? '',
      umamiWebsiteId:           process.env.NUXT_PUBLIC_UMAMI_WEBSITE_ID           ?? '',
      umamiScriptUrl:           process.env.NUXT_PUBLIC_UMAMI_SCRIPT_URL           ?? '',
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/main.css"],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        // SVG favicons, picked by the browser chrome's own colour scheme —
        // not the site's (it has none, it's light-only). A dark-ink mark on
        // a dark tab strip, or the reverse, disappears. Browsers without
        // media-query favicon support fall through to the static ones below,
        // which stay on the dark-ink mark — the safer default against the
        // still-common light browser chrome.
        { rel: "icon", type: "image/svg+xml", href: "/favicon-light.svg", media: "(prefers-color-scheme: light)" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon-dark.svg", media: "(prefers-color-scheme: dark)" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://cdn.sanity.io" },
        { rel: "preconnect", href: "https://challenges.cloudflare.com" },
        { rel: "preconnect", href: "https://stat.lyoraeth.art" },
      ],
      style: [
        // Cascade layer order, pinned before any stylesheet loads. Nuxt inlines
        // component styles ahead of the main bundle, so without this the order
        // is decided by whichever file happens to be parsed first — and the
        // legacy globals end up outranking the shell that should override them.
        {
          innerHTML: '@layer theme, base, legacy, shell, components, utilities;',
          tagPriority: -100,
        },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
  },

  routeRules: {
    // GSC flagged /ru/rss.xml as a duplicate of /rss.xml — content actually
    // differs (EN "writing" vs RU "блог"), a false positive, but a feed has
    // nowhere useful to rank anyway; it doesn't need to be indexed to be
    // subscribed to.
    '/rss.xml':    { headers: { 'X-Robots-Tag': 'noindex' } },
    '/ru/rss.xml': { headers: { 'X-Robots-Tag': 'noindex' } },
    '/llms-full.txt':  { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
    '/avatar.webp':    { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    // Portrait variants: cached long, but not immutable — the file names carry
    // no hash, so a new photo has to be able to replace them.
    '/face/**':        { headers: { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' } },
    '/favicon-light.svg': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/favicon-dark.svg':  { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/favicon.ico':    { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/favicon-32.png': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/favicon-16.png': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/apple-touch-icon.png': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    '/site.webmanifest':     { headers: { 'Cache-Control': 'public, max-age=86400' } },
    '/**': {
      headers: {
        'Strict-Transport-Security':  'max-age=31536000; includeSubDomains; preload',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Frame-Options':            'DENY',
        'Permissions-Policy':         'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()',
        // Report-Only: violations logged in DevTools, nothing blocked yet.
        // Switch to Content-Security-Policy once allowlist is verified in prod.
        'Content-Security-Policy-Report-Only': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://stat.lyoraeth.art",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://cdn.sanity.io data: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.sanity.io https://stat.lyoraeth.art",
          "frame-src https://challenges.cloudflare.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "report-uri /api/csp-report",
        ].join('; '),
      },
    },
  },

  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  components: [
    { path: '~/components', pathPrefix: true, ignore: ['**/sections/**'] },
    { path: '~/components/sections', pathPrefix: false },
  ],

  modules: ["@nuxtjs/i18n", "@nuxtjs/turnstile"],

  turnstile: {
    siteKey:   process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA',
    secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY_CONTACT ?? '',
  },

  i18n: {
    locales: [
      { code: "en", language: "en-US", file: "en.json", name: "English" },
      { code: "ru", language: "ru-RU", file: "ru.json", name: "Русский" },
    ],
    defaultLocale: "en",
    strategy: "prefix_except_default",
    langDir: "locales/",
    baseUrl: "https://lyoraeth.art",
    vueI18n: "./i18n.config.ts",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_locale",
      cookieSecure: true,
      alwaysRedirect: false,
      fallbackLocale: "en",
    },
  },
});
