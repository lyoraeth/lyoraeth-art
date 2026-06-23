// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/main.css"],

  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      meta: [
        { name: "theme-color", content: "#0A0C10" },
        { name: "color-scheme", content: "dark" },
      ],
    },
  },

  components: [
    { path: '~/components', pathPrefix: true, ignore: ['**/sections/**'] },
    { path: '~/components/sections', pathPrefix: false },
  ],

  modules: ["@nuxtjs/google-fonts", "@nuxtjs/i18n"],

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
    langDir: "locales/", /* resolved as i18n/locales/ by @nuxtjs/i18n v10 */
    baseUrl: "https://lyoraeth.art",
  },
});