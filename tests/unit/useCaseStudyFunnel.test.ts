import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

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

let mockObserve: ReturnType<typeof vi.fn>
let mockUnobserve: ReturnType<typeof vi.fn>
let mockDisconnect: ReturnType<typeof vi.fn>
let ioCallback: IntersectionObserverCallback
let unobserved: Set<Element>

beforeEach(() => {
  unobserved    = new Set()
  mockObserve   = vi.fn()
  mockUnobserve = vi.fn((el: Element) => unobserved.add(el))
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

  vi.stubGlobal('umami', { track: vi.fn() })
})

afterEach(() => vi.unstubAllGlobals())

// A real IntersectionObserver never delivers another entry for a target
// after unobserve() — mirrored here since the composable relies on exactly
// that to avoid re-firing on a repeat intersection.
function intersect(target: Element) {
  if (unobserved.has(target)) return
  ioCallback([{ isIntersecting: true, target } as IntersectionObserverEntry], {} as IntersectionObserver)
}

describe('useCaseStudyFunnel', () => {
  it('fires work-open on mount', () => {
    withSetup(() => useCaseStudyFunnel('some-case'))
    expect((window as any).umami.track).toHaveBeenCalledWith('work-open', { slug: 'some-case' })
  })

  // Refs assigned synchronously in setup() (mirroring what a template ref
  // does — resolved before any onMounted runs, including the composable's
  // own) are what observe() actually sees; the file's own comments note the
  // same constraint for the equivalent pattern in useReveal.ts.
  it('tracks work-depth and work-completed when their markers intersect, each once', () => {
    const depth = document.createElement('span')
    const end   = document.createElement('span')

    withSetup(() => {
      const refs = useCaseStudyFunnel('some-case')
      refs.depthEl.value = depth
      refs.endEl.value = end
      return refs
    })

    intersect(depth)
    intersect(end)
    // a repeat intersection (e.g. scrolling back up and down again) must not
    // double-fire — the composable unobserves after the first hit
    intersect(depth)

    const track = (window as any).umami.track as ReturnType<typeof vi.fn>
    expect(track).toHaveBeenCalledWith('work-depth', { slug: 'some-case' })
    expect(track).toHaveBeenCalledWith('work-completed', { slug: 'some-case' })
    expect(track).toHaveBeenCalledTimes(3) // open + depth + completed, not a second depth
    expect(mockUnobserve).toHaveBeenCalledWith(depth)
    expect(mockUnobserve).toHaveBeenCalledWith(end)
  })

  it('disconnects the observer on unmount', () => {
    const { unmount } = withSetup(() => useCaseStudyFunnel('some-case'))
    unmount()
    expect(mockDisconnect).toHaveBeenCalledOnce()
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useCaseStudyFunnel } from '../../app/composables/useCaseStudyFunnel'
