import { describe, it, expect } from 'vitest'
import {
  sanityAssetHash, effectiveWidths, mediaBasename, MEDIA_WIDTHS,
  detectAnimation, animatedBasename, parseAnimatedBasename,
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

  it('trims the cover ladder to the source too', () => {
    expect(effectiveWidths('cover', 1000)).toEqual([480, 960, 1000])
  })
})

describe('mediaBasename', () => {
  it('is the on-disk name and the URL segment, one shape', () => {
    expect(mediaBasename(HASH, 'cover', 480, 'avif')).toBe(`${HASH}-cover-480.avif`)
  })
})

const ascii = (s: string) => [...s].map(c => c.charCodeAt(0))

/** A RIFF/WEBP header with a VP8X chunk — enough for the flags check. */
function webp(flags: number | null): Uint8Array {
  const body = flags === null
    ? [...ascii('VP8 '), 0, 0, 0, 0]
    : [...ascii('VP8X'), 10, 0, 0, 0, flags, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  return Uint8Array.from([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP'), ...body])
}

/** A GIF89a with a 2-colour global table and `frames` 1×1 image blocks, each
 *  behind a graphic control extension. */
function gif(frames: number): Uint8Array {
  const frame = [0x21, 0xF9, 0x04, 0, 0, 0, 0, 0,   // graphic control extension
    0x2C, 0, 0, 0, 0, 1, 0, 1, 0, 0,               // image descriptor, no local table
    2, 2, 0x44, 0x01, 0]                            // LZW size, one data sub-block, end
  return Uint8Array.from([
    ...ascii('GIF89a'), 1, 0, 1, 0, 0x80, 0, 0,    // header + screen descriptor (global table, 2 colours)
    0, 0, 0, 255, 255, 255,                         // the table
    ...Array.from({ length: frames }).flatMap(() => frame),
    0x3B,
  ])
}

describe('detectAnimation', () => {
  it('recognises an animated WebP by the VP8X animation flag', () => {
    expect(detectAnimation(webp(0x12))).toBe('webp')
  })

  it('treats a still WebP — plain VP8, or VP8X without the flag — as not animated', () => {
    expect(detectAnimation(webp(null))).toBeNull()
    expect(detectAnimation(webp(0x10))).toBeNull() // alpha only
  })

  it('recognises a GIF with more than one frame, and not a single-frame one', () => {
    expect(detectAnimation(gif(3))).toBe('gif')
    expect(detectAnimation(gif(1))).toBeNull()
  })

  it('walks a GIF with a local colour table and extensions between frames', () => {
    const withLocalTable = Uint8Array.from([
      ...ascii('GIF89a'), 1, 0, 1, 0, 0x00, 0, 0,                          // no global table
      0x21, 0xFE, 2, 0x68, 0x69, 0,                                         // comment extension
      0x2C, 0, 0, 0, 0, 1, 0, 1, 0, 0x80, 0, 0, 0, 255, 255, 255, 2, 2, 0x44, 0x01, 0, // frame 1, local table
      0x2C, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 0x44, 0x01, 0,                // frame 2
      0x3B,
    ])
    expect(detectAnimation(withLocalTable)).toBe('gif')
  })

  it('is null for other formats, truncated input and empty input', () => {
    expect(detectAnimation(Uint8Array.from([0x89, ...ascii('PNG'), 0, 0, 0, 0]))).toBeNull()
    expect(detectAnimation(webp(0x12).subarray(0, 18))).toBeNull()
    expect(detectAnimation(gif(3).subarray(0, 25))).toBeNull()
    expect(detectAnimation(new Uint8Array())).toBeNull()
  })
})

describe('animatedBasename', () => {
  it('names the stored original, and parses its own names back', () => {
    expect(animatedBasename(HASH, 'webp')).toBe(`${HASH}-anim.webp`)
    expect(parseAnimatedBasename(`${HASH}-anim.gif`)).toEqual({ hash: HASH, kind: 'gif' })
  })

  it('does not mistake a delivery variant for an animation', () => {
    expect(parseAnimatedBasename(mediaBasename(HASH, 'full', 1280, 'webp'))).toBeNull()
    expect(parseAnimatedBasename(`${HASH}-anim.png`)).toBeNull()
  })
})
