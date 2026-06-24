/** Appends Sanity image transform params to a CDN URL. */
export function sanityFmt(
  url: string,
  fmt: 'avif' | 'webp' | 'jpg' | 'png',
  opts: { w?: number; q?: number } = {},
): string {
  try {
    const u = new URL(url)
    u.searchParams.set('fm', fmt)
    if (opts.q !== undefined) u.searchParams.set('q', String(opts.q))
    if (opts.w !== undefined) u.searchParams.set('w', String(opts.w))
    return u.toString()
  } catch {
    return url
  }
}
