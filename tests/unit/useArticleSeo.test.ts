import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach } from 'vitest'

function setup(overrides: Partial<{
  coverUrl:    string | null
  coverWidth:  number | null
  coverHeight: number | null
}> = {}) {
  nuxtMocks.route.path = '/writing/some-post'
  nuxtMocks.route.params = { slug: 'some-post' }
  nuxtMocks.seoMeta.mockClear() // isolate this setup() call's own useSeoMeta call, even within one test

  const result = useArticleSeo({
    type:        'writing',
    title:       () => 'A post title',
    description: () => 'A description',
    coverUrl:    () => overrides.coverUrl ?? null,
    coverWidth:  () => overrides.coverWidth ?? null,
    coverHeight: () => overrides.coverHeight ?? null,
    coverAlt:    () => null,
  })

  return { result, calledWith: nuxtMocks.seoMeta.mock.calls[0]?.[0] as Record<string, unknown> }
}

describe('useArticleSeo', () => {
  beforeEach(resetNuxtMocks)

  it('falls back to the generated 1200×630 card when there is no cover', () => {
    const { result } = setup()
    expect(result.ogImage.value).toBe('https://lyoraeth.art/og/writing/some-post?l=en')
  })

  it('uses the cover, resized, when one exists with known dimensions', () => {
    const { result } = setup({ coverUrl: 'https://cdn.sanity.io/img.jpg', coverWidth: 2400, coverHeight: 1260 })
    expect(result.ogImage.value).toContain('w=1200')
    expect(result.ogImage.value).toContain('fm=jpg')
  })

  // Regression: og:image:width used to be gated on og:image:height resolving,
  // even though both branches always produce a 1200px-wide image — a cover
  // with a resolved URL but missing dimension metadata dropped both instead
  // of just the (genuinely unknown) height.
  it('always reports width 1200, independent of whether height could be derived', () => {
    const withDims = setup({ coverUrl: 'https://cdn.sanity.io/img.jpg', coverWidth: 2400, coverHeight: 1260 })
    expect(withDims.calledWith?.ogImageWidth).toBe(1200)

    const withoutDims = setup({ coverUrl: 'https://cdn.sanity.io/img.jpg', coverWidth: null, coverHeight: null })
    expect(withoutDims.calledWith?.ogImageWidth).toBe(1200)
    // height genuinely can't be derived here — that part staying undefined is correct
    const height = withoutDims.calledWith?.ogImageHeight as { value?: unknown } | undefined
    expect(height?.value).toBeUndefined()

    const generated = setup()
    expect(generated.calledWith?.ogImageWidth).toBe(1200)
  })

  it('computes cover height from the aspect ratio scaled to a 1200px width', () => {
    const { calledWith } = setup({ coverUrl: 'https://cdn.sanity.io/img.jpg', coverWidth: 2400, coverHeight: 1260 })
    const height = calledWith?.ogImageHeight as { value: number }
    expect(height.value).toBe(630) // 1200 * 1260 / 2400
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useArticleSeo } from '../../app/composables/useArticleSeo'
