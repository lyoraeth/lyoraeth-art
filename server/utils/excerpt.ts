/** Markdown → plain text, good enough for meta descriptions and word counts.
 *  Deliberately regex-based: post bodies are our own authored markdown, so a
 *  real parser would be dead weight in the server bundle. */
export function mdPlainText(md: string): string {
  return md
    // fenced code blocks + inline code — code reads as noise in an excerpt
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    // images (before links — same bracket syntax), then links (keep the text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // raw HTML tags
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    // line-start markers: headings, blockquotes, hrules, list bullets
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, ' ')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    // emphasis / strong — keep the text; strong first, lazy so nested emphasis survives
    .replace(/(\*\*|__)([\s\S]+?)\1/g, '$2')
    .replace(/([*_])([^*_]+)\1/g, '$2')
    .replace(/\s+/g, ' ')
    // dropped code/images leave orphaned punctuation ("и , картинкой")
    .replace(/ ([,.;:!?])/g, '$1')
    .trim()
}

/** ≈`max`-char plain-text excerpt cut at a word boundary, single trailing '…'.
 *  Splits on whitespace, not \w — Cyrillic must survive. */
export function mdExcerpt(md: string, max = 160): string {
  const text = mdPlainText(md)
  if (text.length <= max) return text
  const head = text.slice(0, max + 1)
  const lastSpace = head.lastIndexOf(' ')
  const cut = lastSpace > 0 ? head.slice(0, lastSpace) : head.slice(0, max)
  return cut.replace(/[\s,;:.·—\-…!?]+$/, '') + '…'
}
