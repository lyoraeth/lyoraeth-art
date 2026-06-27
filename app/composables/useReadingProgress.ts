export function useReadingProgress() {
  const progress = useState('reading-progress', () => 0)
  const active   = useState('reading-progress-active', () => false)
  return { progress, active }
}
