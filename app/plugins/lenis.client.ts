import Lenis from 'lenis'

export default defineNuxtPlugin(() => {
  // Touch devices get native scrolling, full stop — Lenis's event handling is
  // what broke one-finger scroll on some phones. No smooth-scroll is better
  // than no scroll.
  const coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
  if (coarse) {
    return { provide: { lenis: null as Lenis | null } }
  }

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

  // Touchpads double-smooth: the OS already applies inertia, Lenis lerps on
  // top of it and the result feels laggy. A touchpad can't be detected up
  // front — only by its wheel signature: continuous small/fractional deltas,
  // often with a horizontal component, vs. a mouse wheel's large integer
  // steps. First few wheel events vote; a touchpad verdict destroys Lenis
  // and hands scrolling back to the OS.
  let samples = 0
  let votes = 0
  const stopSampling = () => window.removeEventListener('wheel', onWheel)
  const onWheel = (e: WheelEvent) => {
    if (e.deltaMode !== 0) { stopSampling(); return } // line/page deltas = real wheel
    samples++
    if (Math.abs(e.deltaY) < 40 || e.deltaY % 1 !== 0 || Math.abs(e.deltaX) > 0) votes++
    if (samples >= 6) {
      stopSampling()
      if (votes >= 4) {
        cancelAnimationFrame(raf)
        lenis.destroy()
      }
    }
  }
  window.addEventListener('wheel', onWheel, { passive: true })

  // expose so composables / components can pause, resume, or scrollTo
  return {
    provide: { lenis: lenis as Lenis | null },
  }
})
