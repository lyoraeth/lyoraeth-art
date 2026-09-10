import { Marked, Renderer } from 'marked'
import { mediaSources, sanityAssetHash } from '#shared/media'
import type { GalleryImage } from '../../server/api/post/[slug].get'

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

/** The body text column — a post image spans it (same value the post cover uses). */
const BODY_IMG_SIZES = '(min-width: 48rem) 41rem, calc(100vw - 3rem)'

/**
 * `{fit=cover pos=top ar=16/9}` → an inline style, each value whitelisted so
 * an authored attribute block can't smuggle arbitrary CSS. `ar` is what makes
 * `fit`/`pos` do anything — without a set ratio the image keeps its own and
 * there's nothing to fit against.
 */
function imageStyle(attrs: string): string {
  const kv: Record<string, string> = {}
  for (const pair of attrs.trim().split(/\s+/)) {
    const eq = pair.indexOf('=')
    if (eq > 0) kv[pair.slice(0, eq)] = pair.slice(eq + 1)
  }
  const ar = kv.ar?.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (!ar) return ''
  const decl = [`aspect-ratio:${ar[1]}/${ar[2]}`, `object-fit:${kv.fit === 'contain' ? 'contain' : 'cover'}`]
  if (/^(top|bottom|left|right|center)$/.test(kv.pos ?? '')) decl.push(`object-position:${kv.pos}`)
  return decl.join(';')
}

/** marked configured for post bodies: h2/h3 get anchor ids, images become
 *  captioned figures, `gallery:key` images resolve to a self-hosted `<picture>`,
 *  ```mermaid``` fences become diagram containers (mermaid itself runs
 *  client-side against `.mermaid`, once the post page mounts). Returns a
 *  `renderPost` that also opens external links in a new tab and prepends the
 *  intro anchor the TOC scrolls to.
 *
 * @param gallery - the post's `gallery` array; `gallery:key` references
 * resolve against it. Omit for content that has none (legal pages).
 */
export function useMarkdown(gallery: GalleryImage[] | null = null) {
  const byKey = new Map((gallery ?? []).map(g => [g.key, g]))

  const md = new Marked({
    extensions: [{
      name: 'galleryImage',
      level: 'inline',
      start(src: string) { return src.indexOf('![') },
      tokenizer(src: string) {
        const m = /^!\[([^\]]*)\]\(gallery:([a-z0-9-]+)\)(?:\{([^}]*)\})?/.exec(src)
        if (!m) return undefined
        return { type: 'galleryImage', raw: m[0], alt: m[1] ?? '', key: m[2]!, attrs: m[3] ?? '' }
      },
      renderer(token) {
        const g = byKey.get(token.key)
        const hash = sanityAssetHash(g?.url)
        // Unknown key or a non-Sanity URL: drop it rather than emit a broken
        // <img> — a typo'd reference shouldn't blow a hole in the article.
        if (!g || !hash || !g.url) return `<!-- gallery: ${escapeHtml(token.key)} not found -->`

        const alt = escapeHtml(g.alt || token.alt)
        const style = imageStyle(token.attrs)
        const sources = mediaSources(hash, 'full', g.width || 2560)
          .map(s => `<source type="${s.type}" srcset="${s.srcset}" sizes="${BODY_IMG_SIZES}">`)
          .join('')
        const dims = g.width && g.height ? ` width="${g.width}" height="${g.height}"` : ''
        return `<figure class="post-figure"><picture>${sources}`
          + `<img src="${escapeHtml(g.url)}" alt="${alt}" loading="lazy" class="post-img"${dims}`
          + `${style ? ` style="${style}"` : ''}></picture>`
          + `${token.alt ? `<figcaption class="post-caption">${escapeHtml(token.alt)}</figcaption>` : ''}</figure>`
      },
    }],
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
    const html = (md.parse(raw) as string)
      .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
      // an image is inline-level, so marked wraps a lone one in <p> — <figure>
      // isn't valid there and the empty <p> the browser leaves adds a gap
      .replace(/<p>(<figure\b[^>]*>[\s\S]*?<\/figure>)<\/p>/g, '$1')
    return '<span id="post-body-start" aria-hidden="true" style="display:block;height:0;margin:0;padding:0"></span>' + html
  }

  return { renderPost }
}
