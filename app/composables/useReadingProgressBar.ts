/** Fires `onComplete` once when the reader scrolls to ~95% of an article
 *  while it's mounted (used for the post-completed analytics event). The
 *  visual progress bar this used to drive was dropped from the redesign;
 *  only the completion trigger survives. */
export function useReadingProgressBar(opts: { onComplete?: () => void } = {}) {
  let completed = false

  onMounted(() => {
    const update = () => {
      if (completed) return
      const total = document.documentElement.scrollHeight - window.innerHeight
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0
      if (progress >= 95) {
        completed = true
        opts.onComplete?.()
      }
    }
    window.addEventListener('scroll', update, { passive: true })

    onUnmounted(() => {
      window.removeEventListener('scroll', update)
    })
  })
}
