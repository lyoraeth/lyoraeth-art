/**
 * Markdown helpers that need no Nuxt and no `marked` — shared by the renderer
 * (`useMarkdown`, which stamps anchor ids onto headings), the in-page TOC and
 * the docs index the server builds, so all three derive an id the same way.
 */

/** Turns a heading's text into a stable anchor id — shared by the renderer
 *  (which stamps the id onto <h2>/<h3>) and the TOC (which links to it), so
 *  both sides always agree. */
export function slugifyHeading(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9а-яёa-z\s-]/gi, '').trim().replace(/\s+/g, '-')
}

export interface MdHeading {
  level: 2 | 3
  /** Plain text for display — inline markup (code ticks, emphasis, link
   *  syntax) stripped. */
  text:  string
  /** The anchor the renderer stamps on the heading. Derived from the raw
   *  heading text, exactly as `useMarkdown` does, not from `text`. */
  id:    string
}

/**
 * The h2/h3 headings of a markdown source, in order. Fenced code blocks are
 * skipped — a `## comment` line inside a shell or TOML example is not a
 * heading, and the renderer won't stamp an id on it either.
 */
export function extractHeadings(markdown: string): MdHeading[] {
  const out: MdHeading[] = []
  let fence: string | null = null

  for (const line of markdown.split(/\r?\n/)) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker) {
      if (fence === null) fence = marker[0]!
      else if (marker[0] === fence) fence = null
      continue
    }
    if (fence !== null) continue

    // an optional closing `##` run only counts after a space ("## C#" is "C#")
    const m = /^(#{2,3})\s+(.+?)(?:\s+#+)?\s*$/.exec(line)
    if (!m) continue
    const raw = m[2]!.trim()
    out.push({
      level: m[1]!.length as 2 | 3,
      text:  raw.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, ''),
      id:    slugifyHeading(raw),
    })
  }
  return out
}
