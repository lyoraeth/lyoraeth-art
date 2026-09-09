/** Case-study analytics funnel: fires `work-open` on mount, then `work-depth`
 *  and `work-completed` the first time the reader scrolls the body / end
 *  markers into view. Returns the refs to bind to those markers. */
export function useCaseStudyFunnel(slug: string) {
  const track   = useTrack()
  const depthEl = ref<HTMLElement | null>(null)  // body reached
  const endEl   = ref<HTMLElement | null>(null)  // case study finished
  let caseIo: IntersectionObserver | null = null

  onMounted(() => {
    track(EV.workOpen, { slug })
    caseIo = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        if (e.target === depthEl.value)     track(EV.workDepth, { slug })
        else if (e.target === endEl.value)  track(EV.workCompleted, { slug })
        caseIo?.unobserve(e.target)
      }
    }, { threshold: 1 })
    if (depthEl.value) caseIo.observe(depthEl.value)
    if (endEl.value)   caseIo.observe(endEl.value)
  })
  onUnmounted(() => caseIo?.disconnect())

  return { depthEl, endEl }
}
