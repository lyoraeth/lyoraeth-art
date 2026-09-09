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

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useMarkdown, slugifyHeading } from '../../app/composables/useMarkdown'
