import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach } from 'vitest'

describe('usePlural', () => {
  beforeEach(resetNuxtMocks)

  it('english: singular only at exactly 1', () => {
    nuxtMocks.locale.value = 'en'
    const plural = usePlural()
    expect(plural(1)).toBe('one')
    expect(plural(0)).toBe('many')
    expect(plural(2)).toBe('many')
    expect(plural(11)).toBe('many')
    expect(plural(21)).toBe('many')
  })

  it('russian: one/few/many per CLDR rules, including the 11-14 exception', () => {
    nuxtMocks.locale.value = 'ru'
    const plural = usePlural()
    expect(plural(1)).toBe('one')
    expect(plural(21)).toBe('one')   // ends in 1, not 11 → one
    expect(plural(11)).toBe('many')  // ends in 1 but IS 11 → many, not one
    expect(plural(2)).toBe('few')
    expect(plural(3)).toBe('few')
    expect(plural(4)).toBe('few')
    expect(plural(22)).toBe('few')
    expect(plural(12)).toBe('many')  // 12-14 excluded from "few" despite ending in 2-4
    expect(plural(13)).toBe('many')
    expect(plural(14)).toBe('many')
    expect(plural(5)).toBe('many')
    expect(plural(0)).toBe('many')
    expect(plural(100)).toBe('many')
    expect(plural(101)).toBe('one')
  })

  it('reacts to a locale change without re-calling the composable', () => {
    nuxtMocks.locale.value = 'en'
    const plural = usePlural()
    expect(plural(2)).toBe('many')
    nuxtMocks.locale.value = 'ru'
    expect(plural(2)).toBe('few')
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually.
// Mocks module first: it must register vi.mock() before usePlural.ts's own
// `import { useI18n } from 'vue-i18n'` is evaluated.
import { usePlural } from '../../app/composables/usePlural'
