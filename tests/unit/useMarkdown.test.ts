import { describe, it, expect } from 'vitest'

describe('slugifyHeading', () => {
  it('lowercases, strips punctuation, and hyphenates spaces', () => {
    expect(slugifyHeading('How Many Milliseconds?')).toBe('how-many-milliseconds')
  })

  it('keeps Cyrillic characters', () => {
    expect(slugifyHeading('Сколько миллисекунд')).toBe('сколько-миллисекунд')
  })

  it('collapses repeated whitespace into one hyphen', () => {
    expect(slugifyHeading('a   b')).toBe('a-b')
  })
})

describe('useMarkdown().renderPost', () => {
  it('stamps h2/h3 with an id from slugifyHeading, but leaves h1 bare', () => {
    const { renderPost } = useMarkdown()
    const html = renderPost('# Title\n\n## A Section\n\n### A Subsection\n')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<h2 id="a-section">A Section</h2>')
    expect(html).toContain('<h3 id="a-subsection">A Subsection</h3>')
  })

  it('escapes href/alt/title on images — including quotes, which break out of an attribute', () => {
    const { renderPost } = useMarkdown()
    const html = renderPost('![alt " onerror=alert(1)](http://x.test/a.png "cap\\"tion")')
    // the injected `"` must not land as a real, unescaped attribute-closing
    // quote — only ever as the escaped entity
    expect(html).not.toContain('alt="alt " onerror=alert(1)"')
    expect(html).toContain('alt="alt &quot; onerror=alert(1)"')
    expect(html).toContain('cap&quot;tion')
    expect(html).toContain('class="post-figure"')
    expect(html).toContain('class="post-img"')
  })

  it('wraps a ```mermaid fence in an escaped .mermaid div instead of highlighting it as code', () => {
    const { renderPost } = useMarkdown()
    const html = renderPost('```mermaid\ngraph TD;\n  A --> B;\n```')
    expect(html).toContain('<div class="mermaid">')
    expect(html).not.toContain('<pre><code')
  })

  it('still highlights a regular fenced code block normally', () => {
    const { renderPost } = useMarkdown()
    const html = renderPost('```js\nconst x = 1;\n```')
    expect(html).toContain('<pre><code')
    expect(html).not.toContain('class="mermaid"')
  })

  it('opens external links in a new tab; leaves the link text alone', () => {
    const { renderPost } = useMarkdown()
    const html = renderPost('[a case study](https://example.com/case)')
    expect(html).toContain('href="https://example.com/case" target="_blank" rel="noopener noreferrer"')
  })

  it('prepends the invisible intro anchor the TOC jumps to', () => {
    const { renderPost } = useMarkdown()
    const html = renderPost('Hello')
    expect(html.startsWith('<span id="post-body-start"')).toBe(true)
  })
})

const GALLERY = [{
  key: 'flow-1',
  alt: 'The pipeline, end to end',
  url: 'https://cdn.sanity.io/images/x/production/54c07979619d90658589b216960e1ce570f39285-1852x962.png',
  width: 1852,
  height: 962,
}]

describe('useMarkdown() gallery images', () => {
  it('resolves gallery:key to a self-hosted <picture> with all four formats', () => {
    const { renderPost } = useMarkdown(GALLERY)
    const html = renderPost('![Diagram](gallery:flow-1)')
    expect(html).toContain('<figure class="post-figure"><picture>')
    expect(html).toContain('type="image/jxl"')
    expect(html).toContain('type="image/avif"')
    expect(html).toContain('/media/54c07979619d90658589b216960e1ce570f39285-full-1280.webp 1280w')
    // <img> floor is the raw Sanity URL, dims from the asset
    expect(html).toContain('src="https://cdn.sanity.io/images/x/production/54c07979619d90658589b216960e1ce570f39285-1852x962.png"')
    expect(html).toContain('width="1852" height="962"')
    // the markdown alt becomes the caption
    expect(html).toContain('<figcaption class="post-caption">Diagram</figcaption>')
  })

  it('turns {ar=16/9 fit=cover pos=top} into a whitelisted inline style', () => {
    const { renderPost } = useMarkdown(GALLERY)
    const html = renderPost('![x](gallery:flow-1){ar=16/9 fit=cover pos=top}')
    expect(html).toContain('style="aspect-ratio:16/9;object-fit:cover;object-position:top"')
  })

  it('ignores fit/pos without a ratio, and drops an unknown pos value', () => {
    const { renderPost } = useMarkdown(GALLERY)
    expect(renderPost('![x](gallery:flow-1){fit=cover pos=top}')).not.toContain('aspect-ratio')
    expect(renderPost('![x](gallery:flow-1){ar=4/3 pos=evil;}')).not.toContain('object-position')
  })

  it('drops an unknown key as a comment rather than emitting a broken image', () => {
    const { renderPost } = useMarkdown(GALLERY)
    const html = renderPost('![x](gallery:does-not-exist)')
    expect(html).toContain('<!-- gallery: does-not-exist not found -->')
    expect(html).not.toContain('<img')
  })

  it('leaves a plain markdown image untouched', () => {
    const { renderPost } = useMarkdown(GALLERY)
    const html = renderPost('![x](https://x.test/a.png)')
    expect(html).toContain('src="https://x.test/a.png"')
    expect(html).not.toContain('<picture>')
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useMarkdown, slugifyHeading } from '../../app/composables/useMarkdown'
