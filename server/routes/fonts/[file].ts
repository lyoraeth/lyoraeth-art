import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Serves the licensed woff2 files. They're kept out of the repo (and so out
 * of the CI-built image), so in production they come from a bind-mount under
 * `fontsRoot`; in dev the file usually sits in `public/fonts/` and Nitro's
 * static handler answers first, leaving this as the fallback.
 *
 * Only `<name>.woff2` is accepted — no path segments, nothing but a hash-safe
 * name reaches the filesystem.
 */
const NAME_RE = /^[\w-]+\.woff2$/

export default defineEventHandler(async event => {
  const file = getRouterParam(event, 'file') ?? ''
  if (!NAME_RE.test(file)) throw createError({ statusCode: 404 })

  const path = join(useRuntimeConfig(event).fontsRoot, file)
  const info = await stat(path).catch(() => null)
  if (!info?.isFile()) throw createError({ statusCode: 404 })

  setResponseHeaders(event, {
    'Content-Type':   'font/woff2',
    'Content-Length': String(info.size),
    'Cache-Control':  'public, max-age=31536000, immutable',
    // The font is licensed. A direct download can't be prevented (the browser
    // has to fetch it to render), but this stops another origin from
    // hotlinking it into their own pages.
    'Cross-Origin-Resource-Policy': 'same-origin',
  })
  return sendStream(event, createReadStream(path))
})
