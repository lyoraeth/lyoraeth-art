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

  function observe(...els: (HTMLElement | null | undefined)[]) {
    nextTick(() => {
      els.forEach(el => { if (el && io) io.observe(el) })
    })
  }

  return { observe }
}
