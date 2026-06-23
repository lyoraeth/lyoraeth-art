import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { useGlowCard } from '../../app/composables/useGlowCard'

// ── helpers ───────────────────────────────────────────────────────────────────

function mountGlowCard(el: HTMLElement, tiltReady = true) {
  let unmount!: () => void
  const app = createApp(
    defineComponent({
      setup() {
        const elRef = ref(el)
        const ready = ref(tiltReady)
        useGlowCard(elRef, ready)
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  unmount = () => app.unmount()
  return { unmount }
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
  it('registers pointermove and pointerleave on mount', async () => {
    const el = document.createElement('div')
    const addSpy = vi.spyOn(el, 'addEventListener')

    mountGlowCard(el)
    await nextTick()

    const events = addSpy.mock.calls.map(([event]) => event)
    expect(events).toContain('pointermove')
    expect(events).toContain('pointerleave')
  })

  it('removes listeners and cancels RAF on unmount (no leak)', async () => {
    const el = document.createElement('div')
    const removeSpy = vi.spyOn(el, 'removeEventListener')

    const { unmount } = mountGlowCard(el)
    await nextTick()

    // trigger a move so RAF starts
    el.dispatchEvent(
      Object.assign(new Event('pointermove'), {
        clientX: 100,
        clientY: 100,
        getBoundingClientRect: undefined,
      }),
    )

    unmount()

    const events = removeSpy.mock.calls.map(([event]) => event)
    expect(events).toContain('pointermove')
    expect(events).toContain('pointerleave')
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

  it('tilt returns to 0 after pointerleave (no frozen transform)', async () => {
    const el = document.createElement('div')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 400, height: 300,
      right: 400, bottom: 300, x: 0, y: 0, toJSON: () => {},
    })

    mountGlowCard(el, true)
    await nextTick()

    // move into card
    el.dispatchEvent(Object.assign(new PointerEvent('pointermove'), { clientX: 300, clientY: 200 }))
    // flush several RAF frames to build up tilt
    for (let i = 0; i < 5; i++) {
      const [id, cb] = [...rafCallbacks.entries()][0] ?? []
      if (cb) { cb(performance.now()); rafCallbacks.delete(id) }
    }

    // leave card
    el.dispatchEvent(new PointerEvent('pointerleave'))

    // flush RAF until settled (tilt target = 0, lerp 0.1 needs ~35+ frames)
    for (let i = 0; i < 60; i++) {
      const [id, cb] = [...rafCallbacks.entries()][0] ?? []
      if (!cb) break
      cb(performance.now()); rafCallbacks.delete(id)
    }

    // transform should be cleared once tilt is back at ~0
    const transform = el.style.transform
    expect(transform).toBe('')
  })
})
