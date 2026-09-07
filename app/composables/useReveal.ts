/** Scroll-reveal helper: adds the `in` class to elements the first time they
 *  cross `threshold` visibility, then unobserves them (one-shot). Call `observe`
 *  with the target els once mounted; the observer disconnects on unmount. */
export function useReveal(threshold = 0.12) {
  let io: IntersectionObserver | null = null
  // Child refs resolve before this component's own onMounted runs, so an
  // el handed to observe() this early would otherwise be dropped silently.
  let pending: Element[] = []

  function attach(el: Element) {
    io!.observe(el)
  }

  onMounted(() => {
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          io?.unobserve(entry.target)
        }
      })
    }, { threshold })

    pending.forEach(attach)
    pending = []
  })

  onUnmounted(() => io?.disconnect())

  function observe(...els: (Element | null | undefined)[]) {
    nextTick(() => {
      els.forEach(el => {
        if (!(el instanceof Element)) return
        if (io) attach(el)
        else pending.push(el)
      })
    })
  }

  return { observe }
}
