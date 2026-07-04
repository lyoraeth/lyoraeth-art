import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { useGlowCard } from '../../app/composables/useGlowCard'

// ── helpers ───────────────────────────────────────────────────────────────────

function mountGlowCard(el: HTMLElement) {
  const app = createApp(
    defineComponent({
      setup() {
        const elRef = ref(el)
        useGlowCard(elRef)
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  return { unmount: () => app.unmount() }
}

// ── RAF mock ──────────────────────────────────────────────────────────────────

let rafCallbacks: Map<number, FrameRequestCallback>
let rafId: number

beforeEach(() => {
  rafCallbacks = new Map()
  rafId = 0

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = ++rafId
    rafCallbacks.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCallbacks.delete(id)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useGlowCard', () => {
  it('registers pointermove on mount', async () => {
    const el = document.createElement('div')
    const addSpy = vi.spyOn(el, 'addEventListener')

    mountGlowCard(el)
    await nextTick()

    const events = addSpy.mock.calls.map(([event]) => event)
    expect(events).toContain('pointermove')
  })

  it('removes the listener and cancels RAF on unmount (no leak)', async () => {
    const el = document.createElement('div')
    const removeSpy = vi.spyOn(el, 'removeEventListener')

    const { unmount } = mountGlowCard(el)
    await nextTick()

    // trigger a move so RAF starts
    el.dispatchEvent(
      Object.assign(new PointerEvent('pointermove'), { clientX: 100, clientY: 100 }),
    )
    expect(rafCallbacks.size).toBeGreaterThan(0)

    unmount()

    const events = removeSpy.mock.calls.map(([event]) => event)
    expect(events).toContain('pointermove')
    // all RAF callbacks should be cleared after unmount
    expect(rafCallbacks.size).toBe(0)
  })

  it('sets --gx and --gy CSS vars on pointermove', async () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 400, height: 300,
      right: 400, bottom: 300, x: 0, y: 0, toJSON: () => {},
    })

    mountGlowCard(el)
    await nextTick()

    el.dispatchEvent(
      Object.assign(new PointerEvent('pointermove', { bubbles: true }), {
        clientX: 200, clientY: 150,
      }),
    )

    // flush one RAF frame
    const [, cb] = [...rafCallbacks.entries()][0] ?? []
    if (cb) cb(performance.now())

    // After one lerp step, values should have moved toward target
    const gx = parseFloat(el.style.getPropertyValue('--gx') || '0')
    const gy = parseFloat(el.style.getPropertyValue('--gy') || '0')
    expect(gx).toBeGreaterThan(0)
    expect(gy).toBeGreaterThan(0)
  })

  it('stops rescheduling RAF once the glow settles on the pointer', async () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 400, height: 300,
      right: 400, bottom: 300, x: 0, y: 0, toJSON: () => {},
    })

    mountGlowCard(el)
    await nextTick()

    el.dispatchEvent(
      Object.assign(new PointerEvent('pointermove'), { clientX: 200, clientY: 150 }),
    )

    // flush RAF frames until the lerp converges (loop parks itself when close)
    for (let i = 0; i < 200; i++) {
      const next = [...rafCallbacks.entries()][0]
      if (!next) break
      const [id, cb] = next
      rafCallbacks.delete(id)
      cb(performance.now())
    }

    // loop settled: no pending frame left, glow parked at the pointer
    expect(rafCallbacks.size).toBe(0)
    expect(parseFloat(el.style.getPropertyValue('--gx'))).toBeCloseTo(200, 0)
    expect(parseFloat(el.style.getPropertyValue('--gy'))).toBeCloseTo(150, 0)
  })
})
