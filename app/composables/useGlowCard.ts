export function useGlowCard(el: Ref<HTMLElement | null>, tiltReady: Ref<boolean> = ref(true)) {
  // Blob cursor position
  let bX = 0, bY = 0, tBX = 0, tBY = 0
  // Tilt angles (degrees)
  let tX = 0, tY = 0, tTX = 0, tTY = 0
  let raf: number | null = null

  function tick() {
    bX += (tBX - bX) * 0.085
    bY += (tBY - bY) * 0.085
    tX += (tTX - tX) * 0.1
    tY += (tTY - tY) * 0.1

    const node = el.value
    if (node) {
      node.style.setProperty('--gx', `${bX}px`)
      node.style.setProperty('--gy', `${bY}px`)

      if (Math.abs(tX) > 0.005 || Math.abs(tY) > 0.005) {
        node.style.transform = `perspective(62.5rem) rotateX(${tY}deg) rotateY(${tX}deg)`
      } else if (node.style.transform) {
        node.style.transform = ''
      }
    }

    const done =
      Math.abs(tBX - bX) < 0.3 && Math.abs(tBY - bY) < 0.3 &&
      Math.abs(tTX - tX) < 0.005 && Math.abs(tTY - tY) < 0.005

    if (done) raf = null
    else raf = requestAnimationFrame(tick)
  }

  function startRaf() {
    if (!raf) raf = requestAnimationFrame(tick)
  }

  function onMove(e: PointerEvent) {
    const node = el.value
    if (!node) return
    const rect = node.getBoundingClientRect()
    tBX = e.clientX - rect.left
    tBY = e.clientY - rect.top
    if (tiltReady.value) {
      const px = tBX / rect.width
      const py = tBY / rect.height
      tTX = (px - 0.5) * 1.8
      tTY = (py - 0.5) * -1.8
    }
    startRaf()
  }

  function onLeave() {
    // Tilt returns to flat — blob STAYS where it is (CSS opacity on .card-glare fades it out)
    tTX = 0
    tTY = 0
    startRaf()
  }

  onMounted(() => {
    el.value?.addEventListener('pointermove', onMove, { passive: true })
    el.value?.addEventListener('pointerleave', onLeave)
  })

  onUnmounted(() => {
    el.value?.removeEventListener('pointermove', onMove)
    el.value?.removeEventListener('pointerleave', onLeave)
    if (raf) { cancelAnimationFrame(raf); raf = null }
  })
}
