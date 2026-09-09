import { describe, it, expect } from 'vitest'

describe('sanityFmt', () => {
  const url = 'https://cdn.sanity.io/images/proj/prod/abc-1200x630.jpg'

  it('sets the format param', () => {
    expect(sanityFmt(url, 'webp')).toBe(`${url}?fm=webp`)
  })

  it('adds width and quality when given', () => {
    const out = new URL(sanityFmt(url, 'jpg', { w: 800, q: 70 }))
    expect(out.searchParams.get('fm')).toBe('jpg')
    expect(out.searchParams.get('w')).toBe('800')
    expect(out.searchParams.get('q')).toBe('70')
  })

  it('omits width/quality params that were not given', () => {
    const out = new URL(sanityFmt(url, 'avif'))
    expect(out.searchParams.has('w')).toBe(false)
    expect(out.searchParams.has('q')).toBe(false)
  })

  it('overwrites an existing fm param rather than duplicating it', () => {
    const out = new URL(sanityFmt(`${url}?fm=png`, 'webp'))
    expect(out.searchParams.getAll('fm')).toEqual(['webp'])
  })

  it('returns the input unchanged when it is not a valid URL', () => {
    expect(sanityFmt('not-a-url', 'webp')).toBe('not-a-url')
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { sanityFmt } from '../../app/composables/sanityFmt'
