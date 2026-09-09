import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach } from 'vitest'

const ISO = '2026-03-05T00:00:00Z'

describe('useFormatDate', () => {
  beforeEach(resetNuxtMocks)

  it('short: dd.mm.yyyy on ru, dd/mm/yyyy on en (locale-native separator)', () => {
    nuxtMocks.locale.value = 'en'
    expect(useFormatDate()(ISO)).toBe('05/03/2026')
    nuxtMocks.locale.value = 'ru'
    expect(useFormatDate()(ISO, 'short')).toBe('05.03.2026')
  })

  it('long: spelled-out month, locale-appropriate grammatical case', () => {
    nuxtMocks.locale.value = 'en'
    expect(useFormatDate()(ISO, 'long')).toBe('5 March 2026')
    nuxtMocks.locale.value = 'ru'
    expect(useFormatDate()(ISO, 'long')).toBe('5 марта 2026 г.')
  })

  it('medium: abbreviated month, day-month-year order on both locales', () => {
    nuxtMocks.locale.value = 'en'
    expect(useFormatDate()(ISO, 'medium')).toBe('5 Mar 2026')
    nuxtMocks.locale.value = 'ru'
    expect(useFormatDate()(ISO, 'medium')).toBe('5 мар. 2026')
  })

  it('medium: drops the ru-only trailing "г." the design doesn\'t carry', () => {
    nuxtMocks.locale.value = 'ru'
    expect(useFormatDate()(ISO, 'medium')).not.toContain('г.')
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useFormatDate } from '../../app/composables/useFormatDate'
