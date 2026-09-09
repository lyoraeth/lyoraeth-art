import { vi } from 'vitest'

/**
 * Mocks for the Nuxt / `@nuxtjs/i18n` composables under test call as bare
 * auto-imports. Unlike a browser API (`IntersectionObserver`, `window.open`),
 * these resolve to real package imports once loaded through this project's
 * Nuxt-aware Vite pipeline (`.nuxt/imports.d.ts` names the exact source for
 * each: `useI18n` from `vue-i18n`, `useState`/`useRoute`/`useSeoMeta` from
 * Nuxt's `#app/composables/*`, `useLocalePath` from `@nuxtjs/i18n`) — so
 * `vi.stubGlobal` never sees them; the real function is already bound by the
 * time a composable calls it. `vi.mock` on those exact specifiers is what
 * actually intercepts them.
 *
 * Import this file (for its side effects) before importing the composable
 * under test, so the mocks are registered first.
 */
// Not vi.hoisted(): a vi.mock() factory only runs when the mocked module is
// actually first imported, well after this file's own top-level statements
// have finished — so a plain const declared here is already initialized by
// then. (vi.hoisted() is for referencing values from imports, which really
// do get reordered; it can't itself be exported from a file that also calls
// vi.mock(), which is a separate, unrelated limitation.)
export const nuxtMocks = {
  locale:        { value: 'en' as 'en' | 'ru' },
  route:         { path: '/', params: {} as Record<string, string> },
  state:         new Map<string, { value: unknown }>(),
  navigateTo:    vi.fn(),
  open:          vi.fn(),
  seoMeta:       vi.fn(),
  fetch:         vi.fn(),
  routerReplace: vi.fn(),
  /** What useFetch() resolves `data` to — set per-test before calling the
   *  composable under test. */
  fetchData:     { value: undefined as unknown },
}

/** Resets everything between tests — call from `beforeEach`. */
export function resetNuxtMocks() {
  nuxtMocks.locale.value = 'en'
  nuxtMocks.route.path = '/'
  nuxtMocks.route.params = {}
  nuxtMocks.state.clear()
  nuxtMocks.navigateTo.mockClear()
  nuxtMocks.open.mockClear()
  nuxtMocks.seoMeta.mockClear()
  nuxtMocks.fetch.mockReset()
  nuxtMocks.routerReplace.mockClear()
  nuxtMocks.fetchData.value = undefined
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: nuxtMocks.locale,
    t:  (key: string) => key,
    tm: (_key: string) => [] as unknown[],
    rt: (v: unknown) => String(v),
  }),
}))

vi.mock('#app/composables/router', () => ({
  useRoute:   () => nuxtMocks.route,
  useRouter:  () => ({ replace: nuxtMocks.routerReplace }),
  navigateTo: nuxtMocks.navigateTo,
}))

vi.mock('#app/composables/state', () => ({
  useState: (key: string, init?: () => unknown) => {
    if (!nuxtMocks.state.has(key)) nuxtMocks.state.set(key, { value: init ? init() : undefined })
    return nuxtMocks.state.get(key)
  },
}))

vi.mock('#app/composables/head', () => ({
  useSeoMeta: nuxtMocks.seoMeta,
  useHead:    vi.fn(),
}))

vi.mock('#app/composables/fetch', () => ({
  // Real useFetch is itself awaitable (resolves once the request settles);
  // this mock is already "resolved" by the time a test calls the composable
  // under test, which is enough for an `await useFetch(...)` call site.
  useFetch: () => ({ data: nuxtMocks.fetchData }),
}))

/** `useLocalePath()` stand-in — mirrors `strategy: 'prefix_except_default'`
 *  from nuxt.config.ts. `@nuxtjs/i18n`'s own composable needs a live Nuxt app
 *  instance and can't be reached this way (see `useCardLink`/`useSiteSearch`'s
 *  injectable `localePath` parameter) — pass this directly as that argument,
 *  don't rely on the auto-import resolving in tests. */
export function fakeLocalePath(path: string) {
  return nuxtMocks.locale.value === 'ru' ? `/ru${path}` : path
}
