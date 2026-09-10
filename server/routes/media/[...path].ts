import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { MEDIA_MIME, type MediaFormat } from '#shared/media'

/**
 * Serves the self-hosted image variants written by the `media:sync` task.
 *
 * The pipeline names every file `{sha1}-{family}-{width}.{ext}` and nothing
 * else lands in `mediaRoot`, so the route only accepts exactly that shape —
 * no path traversal, no arbitrary reads, the filename can't carry anything
 * but a hash. A miss (a variant not encoded yet) 404s, and the markup falls
 * back to the source URL.
 */
const NAME_RE = /^[0-9a-f]{40}-(?:cover|full)-\d+\.(jxl|avif|webp|jpg)$/

export default defineEventHandler(async event => {
  const rel = getRouterParam(event, 'path') ?? ''
  const match = rel.match(NAME_RE)
  if (!match) throw createError({ statusCode: 404 })

  const file = join(useRuntimeConfig(event).mediaRoot, rel)
  const info = await stat(file).catch(() => null)
  if (!info?.isFile()) throw createError({ statusCode: 404 })

  setResponseHeaders(event, {
    'Content-Type':   MEDIA_MIME[match[1] as MediaFormat],
    'Content-Length': String(info.size),
    'Cache-Control':  'public, max-age=31536000, immutable',
  })
  return sendStream(event, createReadStream(file))
})
