import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach } from 'vitest'

describe('useLoc', () => {
  beforeEach(resetNuxtMocks)

  it('returns the ru value on the ru locale', () => {
    nuxtMocks.locale.value = 'ru'
    const loc = useLoc()
    expect(loc({ en: 'Hello', ru: 'Привет' })).toBe('Привет')
  })

  it('returns the en value on the en locale', () => {
    nuxtMocks.locale.value = 'en'
    const loc = useLoc()
    expect(loc({ en: 'Hello', ru: 'Привет' })).toBe('Hello')
  })

  it('falls back to en on ru locale when ru is missing', () => {
    nuxtMocks.locale.value = 'ru'
    const loc = useLoc()
    expect(loc({ en: 'Hello', ru: null })).toBe('Hello')
    expect(loc({ en: 'Hello' })).toBe('Hello')
  })

  it('returns an empty string for null/undefined input', () => {
    nuxtMocks.locale.value = 'ru'
    const loc = useLoc()
    expect(loc(null)).toBe('')
    expect(loc(undefined)).toBe('')
  })

  it('treats an empty ru string as missing, not present (falls back on falsy, not just nullish)', () => {
    nuxtMocks.locale.value = 'ru'
    const loc = useLoc()
    // documents actual behaviour: `''` is falsy, so this DOES fall back to en —
    // worth a test precisely because it's the one surprising edge in an
    // otherwise-nullish-only-sounding fallback.
    expect(loc({ en: 'Hello', ru: '' })).toBe('Hello')
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useLoc } from '../../app/composables/useLoc'
