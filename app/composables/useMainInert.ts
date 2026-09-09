const mainInertKey: InjectionKey<Ref<boolean>> = Symbol('main-inert')

/**
 * Layout side of a page-requested `inert` on `<main>`.
 *
 * @remarks
 * `redesign.vue` already puts `<main>` inert while its own mobile menu is
 * open — that state lives in the layout because `<main>` is the layout's
 * element, not the header's. A page-owned overlay (a lightbox, say) needs
 * the same thing but can't reach that ref directly: it's a page, not the
 * layout. This is the other half — a ref the layout provides and ORs into
 * its own inert condition, so either source can hold it inert independently.
 *
 * @returns the ref to OR into `<main>`'s `:inert` binding
 */
export function provideMainInert() {
  const pageInert = ref(false)
  provide(mainInertKey, pageInert)
  return pageInert
}

/**
 * Page side: keeps `<main>` inert for as long as `open` is true.
 *
 * @remarks
 * Resets on unmount — without it, navigating away while `open` is still
 * true (an overlay left open through a header link, say — the header
 * itself is never inert, only `<main>` is) would strand the next page
 * permanently inert, with no `open` left to flip back.
 *
 * @param open - true while the page's own overlay should hold `<main>` inert
 */
export function useMainInert(open: Ref<boolean>) {
  const pageInert = inject(mainInertKey)
  if (!pageInert) throw new Error('useMainInert() requires the redesign layout')

  watch(open, value => {
    pageInert.value = value
  }, { immediate: true })

  onUnmounted(() => {
    pageInert.value = false
  })
}
