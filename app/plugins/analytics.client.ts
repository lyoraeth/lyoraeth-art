export default defineNuxtPlugin(() => {
  const track  = useTrack()
  const router = useRouter()

  // ── Scroll depth — fire each 25/50/75/100 threshold once per page ──
  const thresholds = [25, 50, 75, 100]
  let fired = new Set<number>()

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max <= 0) return
    const pct = (window.scrollY / max) * 100
    for (const t of thresholds) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t)
        track(EV.scrollDepth, { depth: t })
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  router.afterEach(() => { fired = new Set() })

  // ── Outbound clicks — delegated; any <a> to another host ──
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement)?.closest?.('a')
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (!/^https?:\/\//i.test(href)) return
    try {
      if (new URL(href).host !== window.location.host) {
        track(EV.outboundClick, { href })
      }
    } catch { /* malformed href — ignore */ }
  }, { capture: true, passive: true })
})
