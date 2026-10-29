import { readdir } from 'node:fs/promises'
import { parseAnimatedBasename, type AnimatedKind } from '#shared/media'

/**
 * Which images have an animation stored next to their poster variants:
 * `{ [sha1]: 'webp' | 'gif' }`, read off the file names in `mediaRoot`. The
 * client asks once and swaps those images' animation in after the poster.
 * Short-lived cache: the sync task adds entries as it reaches new sources.
 */
export default defineCachedEventHandler(async event => {
  const names = await readdir(useRuntimeConfig(event).mediaRoot).catch(() => [] as string[])
  const out: Record<string, AnimatedKind> = {}
  for (const name of names) {
    const parsed = parseAnimatedBasename(name)
    if (parsed) out[parsed.hash] = parsed.kind
  }
  return out
}, { maxAge: 60, name: 'media-animated' })
