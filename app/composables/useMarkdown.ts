import { Marked } from 'marked'

/** Turns a heading's text into a stable anchor id — shared by the renderer
 *  (which stamps the id onto <h2>/<h3>) and the TOC (which links to it), so
 *  both sides always agree. */
export function slugifyHeading(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9а-яёa-z\s-]/gi, '').trim().replace(/\s+/g, '-')
}

/** marked configured for post bodies: h2/h3 get anchor ids, images become
 *  captioned figures. Returns a `renderPost` that also opens external links in
 *  a new tab and prepends the intro anchor the TOC scrolls to. */
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
        const caption = title ? `<figcaption class="post-caption">${title}</figcaption>` : ''
        return `<figure class="post-figure"><img src="${href}" alt="${text ?? ''}" loading="lazy" class="post-img">${caption}</figure>`
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
