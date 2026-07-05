/** Cursor-tracked edge glow for a card: eases `--gx`/`--gy` CSS vars toward the
 *  pointer on an rAF loop (idles when settled). Binds a passive `pointermove`
 *  listener on mount, cleans up on unmount. */
export function useGlowCard(el: Ref<HTMLElement | null>) {
  // Mouse position, eased — drives the cursor-tracked edge glow
  let gX = 0, gY = 0, tGX = 0, tGY = 0
  let raf: number | null = null

  function tick() {
    gX += (tGX - gX) * 0.085
    gY += (tGY - gY) * 0.085

    el.value?.style.setProperty('--gx', `${gX}px`)
    el.value?.style.setProperty('--gy', `${gY}px`)

    if (Math.abs(tGX - gX) < 0.3 && Math.abs(tGY - gY) < 0.3) raf = null
    else raf = requestAnimationFrame(tick)
  }

  function startRaf() {
    if (!raf) raf = requestAnimationFrame(tick)
  }

  function onMove(e: PointerEvent) {
    const node = el.value
    if (!node) return
    const rect = node.getBoundingClientRect()
    tGX = e.clientX - rect.left
    tGY = e.clientY - rect.top
    startRaf()
  }

  onMounted(() => {
    el.value?.addEventListener('pointermove', onMove, { passive: true })
  })

  onUnmounted(() => {
    el.value?.removeEventListener('pointermove', onMove)
    if (raf) { cancelAnimationFrame(raf); raf = null }
  })
}
