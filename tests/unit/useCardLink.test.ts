import { nuxtMocks, resetNuxtMocks, fakeLocalePath } from './_nuxt-mocks'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
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

function clickEvent(overrides: Partial<MouseEvent & { target: EventTarget }> = {}) {
  return {
    detail:   1,
    ctrlKey:  false,
    metaKey:  false,
    shiftKey: false,
    button:   0,
    target:   document.createElement('div'),
    ...overrides,
  } as unknown as MouseEvent
}

describe('useCardLink', () => {
  beforeEach(resetNuxtMocks)
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('opens the card on a plain click outside any text paragraph', () => {
    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent())

    expect(nuxtMocks.navigateTo).toHaveBeenCalledWith('/work/some-project')
  })

  it('opens in a new tab on ctrl/meta/shift-click, without touching the router', () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)

    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent({ ctrlKey: true }))

    expect(open).toHaveBeenCalledWith('/work/some-project', '_blank', 'noopener')
    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
  })

  it('ignores a click that started as a drag past the threshold', () => {
    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.pointerdown({ clientX: 0, clientY: 0 } as PointerEvent)
    result.click(clickEvent({ clientX: 50, clientY: 0 } as unknown as MouseEvent))

    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
  })

  it('leaves an in-card <a> to handle its own click', () => {
    const anchor = document.createElement('a')
    document.body.appendChild(anchor)

    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent({ target: anchor }))

    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
    anchor.remove()
  })

  it('does not navigate while text on the card is selected', () => {
    vi.stubGlobal('getSelection', () => ({ toString: () => 'some selected text' }))

    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent())

    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
  })

  it('waits out the double-click window before navigating from a click inside a paragraph', () => {
    vi.useFakeTimers()
    const p = document.createElement('p')
    document.body.appendChild(p)

    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent({ target: p }))
    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()

    vi.advanceTimersByTime(260)
    expect(nuxtMocks.navigateTo).toHaveBeenCalledWith('/work/some-project')
    p.remove()
  })

  it('a second click within the window cancels the pending navigation (word selection, not a link click)', () => {
    vi.useFakeTimers()
    const p = document.createElement('p')
    document.body.appendChild(p)

    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent({ target: p }))
    result.click(clickEvent({ target: p, detail: 2 }))
    vi.advanceTimersByTime(260)

    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
    p.remove()
  })

  // Regression: unmounting (e.g. the card drops out of a re-filtered/re-sorted
  // list) used to leave the pending single-click timer armed — it would still
  // fire navigateTo() later, carrying the reader off wherever they went next.
  it('cancels the pending single-click navigation on unmount', () => {
    vi.useFakeTimers()
    const p = document.createElement('p')
    document.body.appendChild(p)

    const { result, unmount } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    result.click(clickEvent({ target: p }))
    unmount()
    vi.advanceTimersByTime(260)

    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
    p.remove()
  })

  it('opens middle click in a new tab, same as ctrl-click (a plain click never fires for it)', () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)

    const { result } = withSetup(() => useCardLink(() => '/work/some-project', fakeLocalePath))
    const preventDefault = vi.fn()
    result.auxclick({ button: 1, target: document.createElement('div'), preventDefault } as unknown as MouseEvent)

    expect(preventDefault).toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith('/work/some-project', '_blank', 'noopener')
    expect(nuxtMocks.navigateTo).not.toHaveBeenCalled()
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useCardLink } from '../../app/composables/useCardLink'
