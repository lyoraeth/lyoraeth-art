/** Drives the global reading-progress state (rendered by SiteNav) off scroll
 *  position while an article is mounted, and fires `onComplete` once when the
 *  reader reaches ~95%. Resets the shared state on unmount. */
export function useReadingProgressBar(opts: { onComplete?: () => void } = {}) {
  const { progress, active } = useReadingProgress()
  let completed = false

  onMounted(() => {
    active.value = true
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      progress.value = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0
      if (!completed && progress.value >= 95) {
        completed = true
        opts.onComplete?.()
      }
    }
    window.addEventListener('scroll', update, { passive: true })

    onUnmounted(() => {
      window.removeEventListener('scroll', update)
      active.value = false
      progress.value = 0
    })
  })
}
