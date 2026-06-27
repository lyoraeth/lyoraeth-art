import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    // If only the locale prefix changed (/ru/work ↔ /work), keep scroll position.
    const stripLocale = (p: string) => p.replace(/^\/ru(\/|$)/, '/').replace(/\/+$/, '') || '/'
    if (stripLocale(to.path) === stripLocale(from.path) && !to.hash) {
      return false
    }

    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
}
