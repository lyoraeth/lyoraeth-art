import { describe, it, expect, vi, afterEach } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T
  const app = createApp(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  return { result, unmount: () => app.unmount() }
}

function setScroll(scrollY: number, scrollHeight: number, innerHeight: number) {
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true })
  window.dispatchEvent(new Event('scroll'))
}

describe('useReadingProgressBar', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not fire onComplete before reaching ~95% scrolled', async () => {
    const onComplete = vi.fn()
    withSetup(() => useReadingProgressBar({ onComplete }))
    await nextTick()

    setScroll(500, 2000, 1000) // (500 / (2000-1000)) * 100 = 50%
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('fires onComplete once scroll reaches 95%', async () => {
    const onComplete = vi.fn()
    withSetup(() => useReadingProgressBar({ onComplete }))
    await nextTick()

    setScroll(950, 2000, 1000) // (950 / 1000) * 100 = 95%
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('fires only once even if the reader keeps scrolling past 95%', async () => {
    const onComplete = vi.fn()
    withSetup(() => useReadingProgressBar({ onComplete }))
    await nextTick()

    setScroll(950, 2000, 1000)
    setScroll(980, 2000, 1000)
    setScroll(1000, 2000, 1000)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('treats a page shorter than the viewport (no scroll room) as never complete, not a divide-by-zero', async () => {
    const onComplete = vi.fn()
    withSetup(() => useReadingProgressBar({ onComplete }))
    await nextTick()

    setScroll(0, 800, 1000) // total = 800 - 1000 = negative
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', async () => {
    const onComplete = vi.fn()
    const { unmount } = withSetup(() => useReadingProgressBar({ onComplete }))
    await nextTick()
    unmount()

    setScroll(950, 2000, 1000)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('works with no onComplete callback at all', async () => {
    withSetup(() => useReadingProgressBar())
    await nextTick()
    expect(() => setScroll(950, 2000, 1000)).not.toThrow()
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useReadingProgressBar } from '../../app/composables/useReadingProgressBar'
