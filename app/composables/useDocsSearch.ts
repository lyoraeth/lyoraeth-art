import type { DocsIndexPayload } from '#shared/docs'

/** The panel is a short list, not a results page. */
const RESULT_LIMIT = 8

/** Below this, a query is almost always a stray keystroke rather than intent. */
const MIN_QUERY_LENGTH = 2

export interface DocsSearchResult {
  /** Unique within one result list. */
  key:      string
  pageKey:  string
  /** The page's title in the current language. */
  title:    string
  /** The section the page sits under, in the current language. */
  section:  string | null
  /** The matching heading, when the hit is a heading rather than the page. */
  heading:  string | null
  /** `#anchor` of that heading — null for a page-level hit. */
  hash:     string | null
}

/**
 * Search over a project's docs: page titles and every h2/h3 heading — the
 * shape of the index, not the full text. Same low-dependency approach as
 * `useSiteSearch`: the whole index is already on the page for the sidebar, so
 * matching is a plain substring test, no search library.
 *
 * Titles match in either language regardless of the site's locale. Headings
 * match in the *displayed* language only — the anchor a heading result links
 * to is an id derived from that language's text, so a hit on the other
 * language's heading would point at an id the page doesn't have.
 */
export function useDocsSearch(
  index: () => DocsIndexPayload | null | undefined,
  locale: () => string,
) {
  function search(query: string): DocsSearchResult[] {
    const data = index()
    const q = query.trim().toLowerCase()
    if (!data || q.length < MIN_QUERY_LENGTH) return []

    const ru = locale() === 'ru'
    const pageHits: DocsSearchResult[] = []
    const headingHits: DocsSearchResult[] = []

    for (const section of data.sections) {
      const sectionLabel = (ru && section.heading.ru) || section.heading.en

      for (const page of section.pages) {
        if (page.landing) continue

        const title = (ru && page.title.ru) || page.title.en
        const base = { pageKey: page.key, title, section: sectionLabel }

        const titleMatch = [page.title.en, page.title.ru].some(t => t?.toLowerCase().includes(q))
        if (titleMatch) pageHits.push({ ...base, key: page.key, heading: null, hash: null })

        const headings = data.headings[page.key]
        const shown = (ru && headings?.ru) || headings?.en || []
        for (const h of shown) {
          if (!h.text.toLowerCase().includes(q)) continue
          headingHits.push({ ...base, key: `${page.key}#${h.id}`, heading: h.text, hash: `#${h.id}` })
        }
      }
    }

    // a page whose title matched outranks a heading somewhere inside one
    return [...pageHits, ...headingHits].slice(0, RESULT_LIMIT)
  }

  return { search, minQueryLength: MIN_QUERY_LENGTH }
}
