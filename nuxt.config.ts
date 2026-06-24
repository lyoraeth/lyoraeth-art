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
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://cdn.sanity.io" },
        { rel: "preconnect", href: "https://challenges.cloudflare.com" },
        { rel: "preconnect", href: "https://stat.lyoraeth.art" },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: "theme-color", content: "#0A0C10" },
        { name: "color-scheme", content: "dark" },
      ],
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'Strict-Transport-Security':  'max-age=31536000; includeSubDomains; preload',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Frame-Options':            'DENY',
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

  modules: ["@nuxtjs/google-fonts", "@nuxtjs/i18n", "@nuxtjs/turnstile"],

  turnstile: {
    siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA',
  },

  googleFonts: {
    families: {
      'Golos Text': [400, 600, 700],
      'Onest': [400, 500, 700],
      'JetBrains Mono': [500],
    },
    download: true,
    display: 'swap',
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
