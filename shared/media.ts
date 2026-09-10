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
  cover: [480, 960, 1440],
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
