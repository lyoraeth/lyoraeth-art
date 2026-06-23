import Lenis from 'lenis'

export default defineNuxtPlugin(() => {
  // Prevent browser from restoring scroll position on reload —
  // Lenis would animate from the restored offset instead of starting at 0.
  if (history.scrollRestoration) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const lenis = new Lenis({
    lerp: prefersReducedMotion ? 1 : 0.1,
    smoothWheel: !prefersReducedMotion,
    syncTouch: false,  // native momentum on touch — don't override iOS rubber-band
  })

  let raf: number

  const loop = (time: number) => {
    lenis.raf(time)
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  // expose so composables / components can pause, resume, or scrollTo
  return {
    provide: { lenis },
  }
})
