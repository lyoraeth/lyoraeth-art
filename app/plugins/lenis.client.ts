import Lenis from 'lenis'

export default defineNuxtPlugin(() => {
  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
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
