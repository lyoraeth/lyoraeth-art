import { Marked, Renderer } from 'marked'

/** Turns a heading's text into a stable anchor id — shared by the renderer
 *  (which stamps the id onto <h2>/<h3>) and the TOC (which links to it), so
 *  both sides always agree. */
export function slugifyHeading(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9а-яёa-z\s-]/gi, '').trim().replace(/\s+/g, '-')
}

// Quotes included: used inside HTML attributes (image href/alt/title) as well
// as text content, and an unescaped `"` there would close the attribute early.
function escapeHtml(raw: string) {
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Delegated to for every fenced code block except ```mermaid — reproducing
// marked's own default rather than hand-rolling <pre><code> again.
const defaultRenderer = new Renderer()

/** marked configured for post bodies: h2/h3 get anchor ids, images become
 *  captioned figures, ```mermaid``` fences become diagram containers (mermaid
 *  itself runs client-side against `.mermaid`, once the post page mounts).
 *  Returns a `renderPost` that also opens external links in a new tab and
 *  prepends the intro anchor the TOC scrolls to. */
export function useMarkdown() {
  const md = new Marked({
    renderer: {
      heading({ tokens, text, depth }) {
        const inner = this.parser.parseInline(tokens)
        if (depth === 2 || depth === 3) {
          const id = slugifyHeading(text)
          return `<h${depth} id="${id}">${inner}</h${depth}>\n`
        }
        return `<h${depth}>${inner}</h${depth}>\n`
      },
      image({ href, title, text }) {
        const caption = title ? `<figcaption class="post-caption">${escapeHtml(title)}</figcaption>` : ''
        return `<figure class="post-figure"><img src="${escapeHtml(href)}" alt="${escapeHtml(text ?? '')}" loading="lazy" class="post-img">${caption}</figure>`
      },
      code(token) {
        if (token.lang === 'mermaid') {
          return `<div class="mermaid">${escapeHtml(token.text)}</div>\n`
        }
        return defaultRenderer.code(token)
      },
    },
  })

  function renderPost(raw: string): string {
    const html = md.parse(raw) as string
    const withLinks = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
    return '<span id="post-body-start" aria-hidden="true" style="display:block;height:0;margin:0;padding:0"></span>' + withLinks
  }

  return { renderPost }
}
