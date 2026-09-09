import { describe, it, expect, afterEach, vi } from 'vitest'

describe('useTrack', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('forwards the event and data to window.umami.track when it exists', () => {
    const track = vi.fn()
    vi.stubGlobal('umami', { track })

    useTrack()(EV.workOpen, { slug: 'some-case' })

    expect(track).toHaveBeenCalledWith('work-open', { slug: 'some-case' })
  })

  it('is a silent no-op when umami has not loaded (dev, ad-blockers, env-gated off)', () => {
    vi.stubGlobal('umami', undefined)

    expect(() => useTrack()(EV.postRead, { slug: 'x' })).not.toThrow()
  })

  it('works with no data argument', () => {
    const track = vi.fn()
    vi.stubGlobal('umami', { track })

    useTrack()(EV.contactStart)

    expect(track).toHaveBeenCalledWith('contact-start', undefined)
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useTrack, EV } from '../../app/composables/useTrack'
