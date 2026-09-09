import { nuxtMocks, resetNuxtMocks } from './_nuxt-mocks'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createApp, defineComponent, h, ref, nextTick } from 'vue'

function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T
  const app = createApp(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  return { result, unmount: () => app.unmount() }
}

const MARKDOWN = [
  '# Title (never listed — the TOC only tracks h2/h3)',
  '',
  '## First Section',
  '',
  'text',
  '',
  '### A Nested Bit',
  '',
  'more text',
  '',
  '## Second Section',
].join('\n')

describe('useToc', () => {
  beforeEach(resetNuxtMocks)
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('builds the entry list from markdown headings, intro first, levels preserved', () => {
    const { result } = withSetup(() => useToc({
      markdown: () => MARKDOWN,
      introLabel: () => 'Introduction',
      content: () => '',
    }))

    expect(result.toc.value).toEqual([
      { level: 'intro', text: 'Introduction', id: 'post-body-start' },
      { level: 2, text: 'First Section', id: 'first-section' },
      { level: 3, text: 'A Nested Bit', id: 'a-nested-bit' },
      { level: 2, text: 'Second Section', id: 'second-section' },
    ])
  })

  it('is just the intro entry for markdown with no h2/h3 headings (the page hides a 1-entry TOC itself)', () => {
    const { result } = withSetup(() => useToc({
      markdown: () => 'Just a paragraph, no headings.',
      introLabel: () => 'Introduction',
      content: () => '',
    }))
    expect(result.toc.value).toEqual([{ level: 'intro', text: 'Introduction', id: 'post-body-start' }])
  })

  it('is empty (no intro entry either) when the markdown source itself is empty', () => {
    const { result } = withSetup(() => useToc({
      markdown: () => '',
      introLabel: () => 'Introduction',
      content: () => '',
    }))
    expect(result.toc.value).toEqual([])
  })

  it('jumpTo scrolls to the element and replaces the URL hash', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)

    const el = document.createElement('div')
    el.id = 'first-section'
    document.body.appendChild(el)

    const { result } = withSetup(() => useToc({
      markdown: () => MARKDOWN,
      introLabel: () => 'Introduction',
      content: () => '',
    }))

    result.jumpTo('first-section')

    expect(scrollTo).toHaveBeenCalledOnce()
    expect(nuxtMocks.routerReplace).toHaveBeenCalledWith({ hash: '#first-section' })
  })

  it('jumpTo still updates the hash even when the target element is not on the page', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)

    const { result } = withSetup(() => useToc({
      markdown: () => MARKDOWN,
      introLabel: () => 'Introduction',
      content: () => '',
    }))

    result.jumpTo('does-not-exist')

    expect(scrollTo).not.toHaveBeenCalled()
    expect(nuxtMocks.routerReplace).toHaveBeenCalledWith({ hash: '#does-not-exist' })
  })

  it('tracks the lowest heading above the read line as active, and re-measures when content changes', async () => {
    const h2a = document.createElement('h2')
    h2a.id = 'first-section'
    const h2b = document.createElement('h2')
    h2b.id = 'second-section'
    const body = document.createElement('div')
    body.className = 'post-body'
    body.append(h2a, h2b)
    document.body.appendChild(body)

    vi.stubGlobal('innerHeight', 1000)
    // read line is innerHeight * 0.5 = 500 — first-section above it, second below
    h2a.getBoundingClientRect = () => ({ top: 100 } as DOMRect)
    h2b.getBoundingClientRect = () => ({ top: 900 } as DOMRect)

    const content = ref('v1')
    const { result } = withSetup(() => useToc({
      markdown: () => MARKDOWN,
      introLabel: () => 'Introduction',
      content: () => content.value,
    }))
    await nextTick()
    await nextTick()

    expect(result.activeId.value).toBe('first-section')

    // second-section scrolls above the read line too
    h2b.getBoundingClientRect = () => ({ top: 200 } as DOMRect)
    content.value = 'v2' // simulates the body re-rendering after a locale switch
    await nextTick()
    await nextTick()

    expect(result.activeId.value).toBe('second-section')
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useToc } from '../../app/composables/useToc'
