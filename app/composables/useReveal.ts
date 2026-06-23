export function useReveal(threshold = 0.12) {
  let io: IntersectionObserver | null = null

  onMounted(() => {
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io?.unobserve(entry.target)
        }
      })
    }, { threshold })
  })

  onUnmounted(() => io?.disconnect())

  function observe(...els: (Element | null | undefined)[]) {
    nextTick(() => {
      els.forEach(el => { if (el instanceof Element && io) io.observe(el) })
    })
  }

  return { observe }
}
