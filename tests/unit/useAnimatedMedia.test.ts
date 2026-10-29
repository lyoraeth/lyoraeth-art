import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const HASH = '3067c32ac16d95369f6fb0114028d072b0b0e7cc'
const OTHER = '1005f2baadfaacbb8d3c7213bb67696652f85334'

/** A gallery image as the markdown renderer emits it. */
function picture(hash: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = `<picture>
    <source type="image/avif" srcset="/media/${hash}-full-640.avif 640w">
    <source type="image/jpeg" srcset="/media/${hash}-full-640.jpg 640w">
    <img src="https://cdn.sanity.io/images/x/production/${hash}-1280x540.webp" srcset="x" alt="">
  </picture>`
  return root
}

describe('useAnimatedMedia', () => {
  beforeEach(() => {
    resetNuxtMocks()
    nuxtMocks.fetchData.value = { [HASH]: 'webp' }
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal('Image', class {
      src = ''
      decode = vi.fn().mockResolvedValue(undefined)
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('gives the stored animation for a hash that has one, and nothing for one that has not', () => {
    const { animationUrl } = useAnimatedMedia()
    expect(animationUrl(HASH)).toBe(`/media/${HASH}-anim.webp`)
    expect(animationUrl(OTHER)).toBeNull()
    expect(animationUrl(null)).toBeNull()
  })

  it('keeps the poster for a visitor who asked for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(useAnimatedMedia().animationUrl(HASH)).toBeNull()
  })

  it('swaps a markdown picture to its animation: sources dropped, img pointed at it', async () => {
    const root = picture(HASH)
    await useAnimatedMedia().upgradePictures(root)

    const img = root.querySelector('img')!
    expect(root.querySelectorAll('source')).toHaveLength(0)
    expect(img.getAttribute('src')).toBe(`/media/${HASH}-anim.webp`)
    expect(img.hasAttribute('srcset')).toBe(false)
  })

  it('leaves a picture without an animation untouched', async () => {
    const root = picture(OTHER)
    await useAnimatedMedia().upgradePictures(root)
    expect(root.querySelectorAll('source')).toHaveLength(2)
  })

  it('keeps the poster when the animation fails to load', async () => {
    vi.stubGlobal('Image', class {
      src = ''
      decode = vi.fn().mockRejectedValue(new Error('broken'))
    })
    const root = picture(HASH)
    await useAnimatedMedia().upgradePictures(root)
    expect(root.querySelectorAll('source')).toHaveLength(2)
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useAnimatedMedia } from '../../app/composables/useAnimatedMedia'
