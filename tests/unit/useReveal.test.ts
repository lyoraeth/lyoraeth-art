import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue'

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── mocks ─────────────────────────────────────────────────────────────────────

let mockObserve: ReturnType<typeof vi.fn>
let mockUnobserve: ReturnType<typeof vi.fn>
let mockDisconnect: ReturnType<typeof vi.fn>
let ioCallback: IntersectionObserverCallback

beforeEach(() => {
  mockObserve    = vi.fn()
  mockUnobserve  = vi.fn()
  mockDisconnect = vi.fn()

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) { ioCallback = cb }
      observe    = mockObserve
      unobserve  = mockUnobserve
      disconnect = mockDisconnect
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useReveal', () => {
  it('observes a ref element on mount', async () => {
    const { result, unmount } = withSetup(() => {
      const { observe } = useReveal()
      const el = ref(document.createElement('div'))
      onMounted(() => observe(el.value))
      return { observe }
    })
    await nextTick()
    await nextTick()
    expect(mockObserve).toHaveBeenCalledOnce()
    unmount()
  })

  it('adds .in class when element intersects', async () => {
    const el = document.createElement('div')
    el.classList.add('reveal')

    withSetup(() => {
      const { observe } = useReveal()
      onMounted(() => observe(el))
      return {}
    })
    await nextTick()
    await nextTick()

    // simulate intersection
    ioCallback([{ isIntersecting: true, target: el } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(el.classList.contains('in')).toBe(true)
    expect(mockUnobserve).toHaveBeenCalledWith(el)
  })

  it('does NOT add .in when not intersecting', async () => {
    const el = document.createElement('div')
    el.classList.add('reveal')

    withSetup(() => {
      const { observe } = useReveal()
      onMounted(() => observe(el))
      return {}
    })
    await nextTick()
    await nextTick()

    ioCallback([{ isIntersecting: false, target: el } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(el.classList.contains('in')).toBe(false)
    expect(mockUnobserve).not.toHaveBeenCalled()
  })

  it('disconnects IntersectionObserver on unmount (no leak)', async () => {
    const { unmount } = withSetup(() => {
      const { observe } = useReveal()
      onMounted(() => observe(document.createElement('div')))
      return {}
    })
    await nextTick()
    unmount()
    expect(mockDisconnect).toHaveBeenCalledOnce()
  })
})

// ── auto-import shim ──────────────────────────────────────────────────────────
// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useReveal } from '../../app/composables/useReveal'
