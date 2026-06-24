export default defineNuxtPlugin(() => {
  const { public: { umamiWebsiteId, umamiScriptUrl } } = useRuntimeConfig()
  if (!umamiWebsiteId || !umamiScriptUrl) return

  useHead({
    script: [{
      src:              umamiScriptUrl,
      defer:            true,
      'data-website-id': umamiWebsiteId,
    }],
  })
})
