import { describe, it, expect } from 'vitest'
import {
  sanityAssetHash, effectiveWidths, mediaBasename, MEDIA_WIDTHS,
} from '../../shared/media'

const HASH = '54c07979619d90658589b216960e1ce570f39285'

describe('sanityAssetHash', () => {
  it('pulls the sha1 from a CDN image URL', () => {
    expect(sanityAssetHash(`https://cdn.sanity.io/images/abc/production/${HASH}-1852x962.png`)).toBe(HASH)
  })

  it('pulls it from a raw asset _id', () => {
    expect(sanityAssetHash(`image-${HASH}-1852x962-png`)).toBe(HASH)
  })

  it('is null for anything that is not a Sanity image ref', () => {
    expect(sanityAssetHash('https://example.com/photo.jpg')).toBeNull()
    expect(sanityAssetHash('')).toBeNull()
    expect(sanityAssetHash(null)).toBeNull()
    expect(sanityAssetHash(undefined)).toBeNull()
  })
})

describe('effectiveWidths', () => {
  it('returns the full ladder when the source is large enough', () => {
    expect(effectiveWidths('full', 4000)).toEqual([...MEDIA_WIDTHS.full])
  })

  it('clamps to the source and de-duplicates — a 1200px source is not four near-identical files', () => {
    expect(effectiveWidths('full', 1200)).toEqual([640, 1200])
  })

  it('keeps the exact source width as the top rung when it sits between ladder steps', () => {
    expect(effectiveWidths('full', 1852)).toEqual([640, 1280, 1852])
  })

  it('caps a tiny source at a single width', () => {
    expect(effectiveWidths('cover', 300)).toEqual([300])
  })
})

describe('mediaBasename', () => {
  it('is the on-disk name and the URL segment, one shape', () => {
    expect(mediaBasename(HASH, 'cover', 480, 'avif')).toBe(`${HASH}-cover-480.avif`)
  })
})
