/** Shared reading-progress state (SSR-safe `useState`): `progress` 0–100 and
 *  `active`. Written by an article page via useReadingProgressBar, read by
 *  SiteNav to render the bar. */
export function useReadingProgress() {
  const progress = useState('reading-progress', () => 0)
  const active   = useState('reading-progress-active', () => false)
  return { progress, active }
}
