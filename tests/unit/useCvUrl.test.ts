import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach } from 'vitest'

describe('useCvUrl', () => {
  beforeEach(resetNuxtMocks)

  it('returns the ru CV on the ru locale', async () => {
    nuxtMocks.locale.value = 'ru'
    nuxtMocks.fetchData.value = { cvUrlEn: 'https://x/cv-en.pdf', cvUrlRu: 'https://x/cv-ru.pdf' }

    const cvUrl = await useCvUrl()
    expect(cvUrl.value).toBe('https://x/cv-ru.pdf')
  })

  it('returns the en CV on the en locale', async () => {
    nuxtMocks.locale.value = 'en'
    nuxtMocks.fetchData.value = { cvUrlEn: 'https://x/cv-en.pdf', cvUrlRu: 'https://x/cv-ru.pdf' }

    const cvUrl = await useCvUrl()
    expect(cvUrl.value).toBe('https://x/cv-en.pdf')
  })

  it('falls back to the other language when only one file is uploaded', async () => {
    nuxtMocks.locale.value = 'ru'
    nuxtMocks.fetchData.value = { cvUrlEn: 'https://x/cv-en.pdf', cvUrlRu: null }

    const cvUrl = await useCvUrl()
    expect(cvUrl.value).toBe('https://x/cv-en.pdf')
  })

  it('is undefined when neither language has a file', async () => {
    nuxtMocks.locale.value = 'en'
    nuxtMocks.fetchData.value = { cvUrlEn: null, cvUrlRu: null }

    const cvUrl = await useCvUrl()
    expect(cvUrl.value).toBeUndefined()
  })

  it('is undefined while settings have not loaded (unconfigured CMS, e.g.)', async () => {
    nuxtMocks.locale.value = 'en'
    nuxtMocks.fetchData.value = undefined

    const cvUrl = await useCvUrl()
    expect(cvUrl.value).toBeUndefined()
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useCvUrl } from '../../app/composables/useCvUrl'
