/**
 * Shared vocabulary for the self-hosted media pipeline — used by both the
 * encoder (`server/utils/mediaEncode.ts` + the sync task) and the client
 * (`SanityPicture.vue` and the markdown renderer), so a variant the pipeline
 * writes and a URL the markup asks for always line up.
 *
 * Images are served from `/media/` as static files with immutable caching:
 * the filename carries the source's content hash, so a changed source is a
 * new filename rather than a cache-bust.
 */

/**
 * `cover` is a server-side 4:3 top-anchored crop — the work card and the
 * narrow-screen case cover. `full` is the source aspect ratio untouched —
 * the two-column case layout on wide screens, and the lightbox.
 */
export type MediaFamily = 'cover' | 'full'

/** Delivery formats, in `<picture>` fallback order (first the browser
 *  understands wins). All lossy; the source is never served. */
export const MEDIA_FORMATS = ['jxl', 'avif', 'webp', 'jpg'] as const
export type MediaFormat = typeof MEDIA_FORMATS[number]

export const MEDIA_MIME: Record<MediaFormat, string> = {
  jxl:  'image/jxl',
  avif: 'image/avif',
  webp: 'image/webp',
  jpg:  'image/jpeg',
}

/**
 * The width ladder per family. The pipeline never upscales past the source,
 * so a smaller source just produces fewer distinct widths (see
 * `effectiveWidths`) — there's no per-image or per-context width config, the
 * source width does that on its own. `sizes` in the markup picks which entry
 * a given viewport actually loads.
 */
export const MEDIA_WIDTHS: Record<MediaFamily, readonly number[]> = {
  // cover shows below 80rem — often a 2–3× phone or tablet, ~350–620 CSS px,
  // so the ladder reaches 1920 for a crisp 3× render
  cover: [480, 960, 1440, 1920],
  full:  [640, 1280, 1920, 2560],
}

/** Longer edge every family caps at — the case-study source master. */
export const MEDIA_MASTER_MAX = 2560

/**
 * The widths actually generated for a source of `sourceWidth` px: the ladder
 * clamped to the source and de-duplicated, so a 1200px source yields e.g.
 * [640, 1200] rather than four near-identical files.
 */
export function effectiveWidths(family: MediaFamily, sourceWidth: number): number[] {
  const seen = new Set<number>()
  for (const w of MEDIA_WIDTHS[family]) {
    seen.add(Math.min(w, sourceWidth))
  }
  return [...seen].sort((a, b) => a - b)
}

/** `{hash}-{family}-{width}.{format}` — the on-disk name and the URL path
 *  segment, one definition both sides share. */
export function mediaBasename(hash: string, family: MediaFamily, width: number, format: MediaFormat): string {
  return `${hash}-${family}-${width}.${format}`
}

/** The `<source srcset>` for one family/format — every generated width, as
 *  `/media/…` URLs. `sourceWidth` decides which widths exist (see
 *  `effectiveWidths`). */
export function mediaSrcset(hash: string, family: MediaFamily, sourceWidth: number, format: MediaFormat): string {
  return effectiveWidths(family, sourceWidth)
    .map(w => `/media/${mediaBasename(hash, family, w, format)} ${w}w`)
    .join(', ')
}

/** `<source>` `{ type, srcset }` pairs for one family, in fallback order —
 *  for the single-family case (a body image). */
export function mediaSources(hash: string, family: MediaFamily, sourceWidth: number): { type: string; srcset: string }[] {
  return MEDIA_FORMATS.map(f => ({ type: MEDIA_MIME[f], srcset: mediaSrcset(hash, family, sourceWidth, f) }))
}

/**
 * The viewport at which a case study switches from the stacked 4:3 crop to
 * the two-column source-ratio layout — the `<picture>` art-direction
 * breakpoint, matching `@media (width >= 80rem)` in the page CSS.
 */
export const MEDIA_ART_DIRECTION = '(min-width: 80rem)'

/**
 * The content hash for a Sanity image, pulled from its asset URL or `_id`.
 * Sanity names assets `image-{sha1}-{w}x{h}-{ext}`, and the CDN URL ends
 * `/{sha1}-{w}x{h}.{ext}` — either way the sha1 is the stable id. Returns
 * null for anything that isn't a Sanity image reference.
 */
export function sanityAssetHash(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null
  const m = urlOrId.match(/(?:^image-|\/)([0-9a-f]{40})-\d+x\d+[.-]/)
  return m ? m[1]! : null
}

/**
 * Animated sources skip the encoder: its output is a still, so the pipeline
 * keeps only a first-frame poster in the usual variants, and the source is
 * stored as is next to them under `animatedBasename`. The client shows the
 * poster first and swaps the animation in once it has loaded.
 */
export type AnimatedKind = 'webp' | 'gif'

/** `{hash}-anim.{kind}` — the stored original of an animated source. */
export function animatedBasename(hash: string, kind: AnimatedKind): string {
  return `${hash}-anim.${kind}`
}

/** The kind and hash back out of an `animatedBasename`, or null for any other
 *  file name in the media directory. */
export function parseAnimatedBasename(name: string): { hash: string; kind: AnimatedKind } | null {
  const m = name.match(/^([0-9a-f]{40})-anim\.(webp|gif)$/)
  return m ? { hash: m[1]!, kind: m[2] as AnimatedKind } : null
}

/**
 * Whether the bytes are an animated WebP or GIF, by header alone — nothing is
 * decoded, so a still `.webp`/`.gif` and an animated one are told apart before
 * any tool touches the file. A single-frame GIF is still, not animated.
 */
export function detectAnimation(bytes: Uint8Array): AnimatedKind | null {
  return isAnimatedWebp(bytes) ? 'webp' : isAnimatedGif(bytes) ? 'gif' : null
}

function ascii(bytes: Uint8Array, from: number, to: number): string {
  return String.fromCharCode(...bytes.subarray(from, to))
}

/** `RIFF….WEBP` + a `VP8X` chunk whose flags byte has the animation bit (0x02). */
function isAnimatedWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 21) return false
  return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP'
    && ascii(bytes, 12, 16) === 'VP8X' && (bytes[20]! & 0x02) !== 0
}

/** Walks the GIF's blocks and counts image descriptors — more than one is an
 *  animation. A truncated file ends the walk with whatever was counted. */
function isAnimatedGif(bytes: Uint8Array): boolean {
  const head = ascii(bytes, 0, 6)
  if (head !== 'GIF87a' && head !== 'GIF89a') return false

  // sub-blocks: a run of length-prefixed chunks ended by a zero length
  const skipSubBlocks = (at: number): number => {
    while (at < bytes.length && bytes[at] !== 0) at += bytes[at]! + 1
    return at + 1
  }

  const flags = bytes[10] ?? 0
  let pos = 13 + (flags & 0x80 ? 3 * 2 ** ((flags & 0x07) + 1) : 0)
  let frames = 0

  while (pos < bytes.length) {
    const block = bytes[pos]
    if (block === 0x3B) break
    if (block === 0x21) {
      pos = skipSubBlocks(pos + 2)
    }
    else if (block === 0x2C) {
      if (++frames > 1) return true
      const local = bytes[pos + 9] ?? 0
      pos += 10 + (local & 0x80 ? 3 * 2 ** ((local & 0x07) + 1) : 0)
      pos = skipSubBlocks(pos + 1) // the LZW minimum code size, then the data
    }
    else {
      break
    }
  }
  return false
}
