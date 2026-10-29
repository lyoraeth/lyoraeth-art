import { animatedBasename, type AnimatedKind } from '#shared/media'

/**
 * Animated images. The pipeline keeps a still poster of each (the usual
 * variants) and stores the animated original beside it; the server lists
 * which hashes have one. A picture shows its poster, and once the animation
 * has downloaded and decoded it takes the poster's place — so the page never
 * waits on the larger file.
 *
 * Client-only on purpose: the SSR'd markup is always the poster.
 */
export function useAnimatedMedia() {
  // one request for the whole app, shared by every picture through the key
  const { data } = useFetch<Record<string, AnimatedKind>>('/api/media-animated', {
    key:     'media-animated',
    server:  false,
    lazy:    true,
    default: () => ({}),
  })

  /** The URL of the stored animation for an image, or null when it has none
   *  (or the visitor asked for reduced motion — they keep the poster). */
  function animationUrl(hash: string | null): string | null {
    if (!hash || import.meta.server) return null
    const kind = data.value[hash]
    if (!kind) return null
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
    return `/media/${animatedBasename(hash, kind)}`
  }

  /** Resolves once the animation is downloaded and decoded; false when it
   *  could not be (the poster simply stays). */
  async function preload(url: string): Promise<boolean> {
    const img = new Image()
    img.src = url
    try {
      await img.decode()
      return true
    }
    catch {
      return false
    }
  }

  /**
   * Upgrades the markdown-rendered pictures under `root` (those are plain
   * HTML, outside Vue): each `<picture>` whose image has an animation drops
   * its `<source>`s and points `<img>` at it.
   */
  async function upgradePictures(root: ParentNode = document) {
    for (const picture of root.querySelectorAll<HTMLPictureElement>('picture')) {
      const img = picture.querySelector('img')
      const hash = picture.querySelector('source')?.getAttribute('srcset')?.match(/\/media\/([0-9a-f]{40})-/)?.[1]
      const url = animationUrl(hash ?? null)
      if (!img || !url || img.dataset.animated) continue
      img.dataset.animated = '1'
      if (!await preload(url)) continue
      picture.querySelectorAll('source').forEach(s => s.remove())
      img.removeAttribute('srcset')
      img.src = url
    }
  }

  return { animations: data, animationUrl, preload, upgradePictures }
}
