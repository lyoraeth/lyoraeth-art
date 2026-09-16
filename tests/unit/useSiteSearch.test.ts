import { nuxtMocks, resetNuxtMocks, fakeLocalePath } from './_nuxt-mocks'
import { describe, it, expect, beforeEach } from 'vitest'

function seedWork(items: unknown[]) {
  nuxtMocks.state.set('search-work', { value: items })
}
function seedPosts(items: unknown[]) {
  nuxtMocks.state.set('search-posts', { value: items })
}

const workItem = (over: Record<string, unknown> = {}) => ({
  _id: 'w1', slug: 'crm-rebuild', year: 2025, tags: ['CRM', 'Vue'],
  title: { en: 'CRM rebuild', ru: 'Переделка CRM' },
  ...over,
})
const postItem = (over: Record<string, unknown> = {}) => ({
  _id: 'p1', slug: 'animation-timing', tags: ['UI'],
  title: { en: 'Animation timing', ru: 'Тайминги анимации' },
  topic: { en: 'Interfaces', ru: 'Интерфейсы' },
  ...over,
})

describe('useSiteSearch', () => {
  beforeEach(resetNuxtMocks)

  it('returns nothing below the minimum query length', () => {
    seedWork([workItem()])
    const { search, minQueryLength } = useSiteSearch(fakeLocalePath)
    expect(minQueryLength).toBe(2)
    expect(search('c')).toEqual({ work: [], writing: [], pages: [] })
  })

  it('matches work items by title in either language, regardless of active locale', () => {
    seedWork([workItem()])
    const { search } = useSiteSearch(fakeLocalePath)
    expect(search('rebuild').work).toHaveLength(1)
    expect(search('переделка').work).toHaveLength(1) // ru title, even though active locale is en
    expect(search('nonexistent').work).toHaveLength(0)
  })

  it('matches work items by tag', () => {
    seedWork([workItem()])
    const { search } = useSiteSearch(fakeLocalePath)
    expect(search('vue').work).toHaveLength(1)
  })

  it('matches posts by title, topic, or tag', () => {
    seedPosts([postItem()])
    const { search } = useSiteSearch(fakeLocalePath)
    expect(search('timing').writing).toHaveLength(1)
    expect(search('interfaces').writing).toHaveLength(1)
    expect(search('ui').writing).toHaveLength(1)
  })

  it('matches legal pages by their fixed EN/RU titles', () => {
    const { search } = useSiteSearch(fakeLocalePath)
    expect(search('privacy').pages.map(p => p.key)).toEqual(['privacy'])
    expect(search('политика').pages.map(p => p.key)).toEqual(['privacy'])
    expect(search('personal data').pages.map(p => p.key)).toEqual(['personal-data'])
  })

  it('caps each group at the result limit', () => {
    seedWork(Array.from({ length: 8 }, (_, i) => workItem({ _id: `w${i}`, slug: `p-${i}` })))
    const { search } = useSiteSearch(fakeLocalePath)
    expect(search('rebuild').work).toHaveLength(5)
  })

  it('fetches the catalog once; a second ensureLoaded() call does not refetch', async () => {
    nuxtMocks.fetch.mockResolvedValue([])
    const { ensureLoaded, ready } = useSiteSearch(fakeLocalePath)
    expect(ready.value).toBe(false)
    await ensureLoaded()
    expect(ready.value).toBe(true)
    expect(nuxtMocks.fetch).toHaveBeenCalledTimes(2) // posts + work

    await ensureLoaded()
    expect(nuxtMocks.fetch).toHaveBeenCalledTimes(2) // still 2 — no refetch
  })

  it('still marks the search ready after a failed fetch, rather than leaving the panel stuck loading', async () => {
    nuxtMocks.fetch.mockRejectedValue(new Error('network down'))
    const { ensureLoaded, ready } = useSiteSearch(fakeLocalePath)
    await ensureLoaded()
    expect(ready.value).toBe(true)
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useSiteSearch } from '../../app/composables/useSiteSearch'
