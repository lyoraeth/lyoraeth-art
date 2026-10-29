import type { MdHeading } from './markdown'

/**
 * Pure logic behind the project docs mirror — no Nuxt, no fetching. The server
 * uses it to turn a repo's `SUMMARY.md` into a nav index; the markdown renderer
 * uses the same path resolver to decide where a relative link inside a docs
 * page should go, so there is exactly one relative-path algorithm in the
 * feature.
 *
 * The source format is mdBook's `SUMMARY.md`: a `#` title, `##` section
 * headings and `* [Title](path.md)` entries.
 */

/** Docs are rendered through `v-html` on our own domain, so a project's repo
 *  has to belong to this owner. The Sanity schema enforces the same rule at
 *  edit time; this is the server-side check that doesn't trust it. */
export const DOCS_REPO_OWNER = 'lyoraeth'

/** The branch docs are read from — on the server to fetch them, and on the
 *  client to point a link to a repo file at the same revision. Always the
 *  default branch for now; pinning a tag per project is possible later,
 *  nothing needs it yet. */
export const DOCS_REF = 'main'

/** `{ owner, repo }` from a `https://github.com/<owner>/<repo>` URL, or null
 *  when it isn't one — or the owner isn't `DOCS_REPO_OWNER`. */
export function parseRepoUrl(url: string | null | undefined): { owner: string; repo: string } | null {
  const m = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url ?? '')
  if (!m || m[1] !== DOCS_REPO_OWNER) return null
  return { owner: m[1], repo: m[2]! }
}

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

/** A scheme (`https:`, `mailto:`…) or a protocol-relative URL. */
export function isExternalHref(href: string): boolean {
  return EXTERNAL.test(href)
}

/**
 * Resolves `target` against `baseDir` (both repo-relative, `/`-separated) into
 * a repo-relative path. Generic `..`/`.` handling, nothing shaped around the
 * `../README.md` case — and a path that climbs out of the repo root resolves
 * to null rather than being clamped, so a hostile `../../..` can't turn into a
 * real path. A leading `/` means repo root, as on GitHub. Query and hash are
 * the caller's business: this only knows paths.
 */
export function resolveRepoRelativePath(baseDir: string, target: string): string | null {
  const path = target.split('#')[0]!.split('?')[0]!
  if (!path) return null

  const segments = path.startsWith('/') ? [] : baseDir.split('/').filter(Boolean)
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (segments.length === 0) return null
      segments.pop()
    }
    else {
      segments.push(part)
    }
  }
  return segments.length ? segments.join('/') : null
}

/** The README entries — they stay in the nav, but as a link to the project's
 *  landing page rather than a mirrored docs page (a GitHub README is HTML
 *  with relative image paths; the landing page is where that content lives). */
export function isLandingPath(path: string): boolean {
  return /(^|\/)readme(\.[a-z-]+)?\.md$/i.test(path)
}

/** A flat, URL-safe key from a file name: `docs/Module-API.md` → `module-api`. */
export function pageKey(path: string): string {
  const stem = path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/i, '')
  return stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page'
}

/* ── SUMMARY.md → nav tree ───────────────────────────────────────────────── */

export interface DocsNavEntry {
  title: string
  /** Repo-relative, already resolved — `docs/guide.md`, `README.md`. */
  path:  string
}

export interface DocsNavSection {
  /** `null` for entries that come before the first `##` heading. */
  heading: string | null
  entries: DocsNavEntry[]
}

export interface DocsNav {
  title:    string
  sections: DocsNavSection[]
}

/**
 * Parses an mdBook `SUMMARY.md`.
 *
 * @param markdown - the file's text
 * @param baseDir - the repo-relative directory the file lives in (`docs`,
 * `docs/ru`) — what every link in it is relative to
 *
 * Anything that isn't a title, a section heading or a link entry is skipped —
 * notably the language-switcher line mdBook-style summaries carry
 * (`**English** · [Русский](ru/SUMMARY.md)`), since the site switches locale
 * itself. Entries pointing at a URL, outside the repo, or at a non-`.md` file
 * are dropped: there is nothing to mirror.
 */
export function parseSummary(markdown: string, baseDir: string): DocsNav {
  const nav: DocsNav = { title: '', sections: [] }
  let current: DocsNavSection | null = null

  for (const line of markdown.split(/\r?\n/)) {
    const h1 = /^#\s+(.+?)\s*$/.exec(line)
    if (h1) {
      if (!nav.title) nav.title = h1[1]!
      continue
    }

    const h2 = /^##\s+(.+?)\s*$/.exec(line)
    if (h2) {
      current = { heading: h2[1]!, entries: [] }
      nav.sections.push(current)
      continue
    }

    const entry = /^\s*[*+-]\s+\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(line)
    if (!entry) continue

    const href = entry[2]!
    if (isExternalHref(href)) continue
    const path = resolveRepoRelativePath(baseDir, href)
    if (!path || !/\.md$/i.test(path)) continue

    if (!current) {
      current = { heading: null, entries: [] }
      nav.sections.push(current)
    }
    current.entries.push({ title: entry[1]!, path })
  }

  nav.sections = nav.sections.filter(s => s.entries.length > 0)
  return nav
}

/* ── Both locales → one index ────────────────────────────────────────────── */

export interface DocsPage {
  /** Stable across locales: the file name of the EN entry, flattened. */
  key:     string
  landing: boolean
  title:   { en: string; ru: string | null }
  path:    { en: string; ru: string | null }
}

export interface DocsSection {
  heading: { en: string | null; ru: string | null }
  pages:   DocsPage[]
}

export interface DocsIndex {
  title:    { en: string; ru: string | null }
  sections: DocsSection[]
  /** Whether the RU tree could be matched against the EN one. When it can't,
   *  every RU field is null and the RU site shows the EN docs. */
  paired:   boolean
}

function sameShape(a: DocsNav, b: DocsNav): boolean {
  return a.sections.length === b.sections.length
    && a.sections.every((s, i) => s.entries.length === b.sections[i]!.entries.length)
}

/**
 * Merges the EN and RU trees into one index keyed by EN file names.
 *
 * The two trees are matched by *position* (section index, entry index), not by
 * file name: a repo's translations don't have to mirror its file layout — here
 * `../CONTRIBUTING.md` in EN is `docs/ru/contributing.md` in RU, and the README
 * is `README.ru.md`. Position-matching is only safe when the trees have the
 * same shape, so if they don't — a section or an entry exists on one side
 * only — nothing is paired at all, rather than risk showing the wrong page
 * under a title.
 */
export function buildDocsIndex(en: DocsNav, ru: DocsNav | null): DocsIndex {
  const paired = ru !== null && sameShape(en, ru)
  const taken = new Set<string>()

  const uniqueKey = (path: string) => {
    const base = pageKey(path)
    let key = base
    for (let n = 2; taken.has(key); n++) key = `${base}-${n}`
    taken.add(key)
    return key
  }

  return {
    title: { en: en.title, ru: paired ? ru.title : null },
    paired,
    sections: en.sections.map((section, i) => ({
      heading: { en: section.heading, ru: paired ? ru.sections[i]!.heading : null },
      pages: section.entries.map((entry, j): DocsPage => {
        const ruEntry = paired ? ru.sections[i]!.entries[j]! : null
        return {
          key:     uniqueKey(entry.path),
          landing: isLandingPath(entry.path),
          title:   { en: entry.title, ru: ruEntry?.title ?? null },
          path:    { en: entry.path, ru: ruEntry?.path ?? null },
        }
      }),
    })),
  }
}

/** Every page in nav order, sections flattened. */
export function docsPages(index: DocsIndex): DocsPage[] {
  return index.sections.flatMap(s => s.pages)
}

/** Repo path → page, for both locales — what a relative link is matched against. */
export function docsPathMap(index: DocsIndex): Map<string, DocsPage> {
  const map = new Map<string, DocsPage>()
  for (const page of docsPages(index)) {
    map.set(page.path.en, page)
    if (page.path.ru) map.set(page.path.ru, page)
  }
  return map
}

/* ── Links inside a docs page ────────────────────────────────────────────── */

export type DocLink
  = | { kind: 'anchor';   hash: string }
    | { kind: 'external'; href: string }
    | { kind: 'page';     key: string; hash: string }
    | { kind: 'landing';  hash: string }
  /** Points at a repo file that isn't a docs page — LICENSE, a source file. */
    | { kind: 'repo';     path: string; hash: string }
  /** Climbs out of the repo; there is nowhere to send it. */
    | { kind: 'dead' }

/**
 * Decides where a link found in a docs page should go.
 *
 * @param href - the link target as written
 * @param fromPath - the repo-relative path of the page the link is in
 * @param pathMap - from `docsPathMap`
 */
export function classifyDocLink(href: string, fromPath: string, pathMap: Map<string, DocsPage>): DocLink {
  if (href.startsWith('#')) return { kind: 'anchor', hash: href }
  if (isExternalHref(href)) return { kind: 'external', href }

  const hashAt = href.indexOf('#')
  const hash = hashAt >= 0 ? href.slice(hashAt) : ''
  const baseDir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : ''

  const path = resolveRepoRelativePath(baseDir, href)
  if (!path) return { kind: 'dead' }

  const page = pathMap.get(path)
  if (page) return page.landing ? { kind: 'landing', hash } : { kind: 'page', key: page.key, hash }
  // the root README is the landing page whether or not the nav lists it
  if (isLandingPath(path) && !path.includes('/')) return { kind: 'landing', hash }
  return { kind: 'repo', path, hash }
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

/** The file's page on github.com — where a link to a non-docs repo file goes. */
export function repoBlobUrl(owner: string, repo: string, ref: string, path: string): string {
  return `https://github.com/${owner}/${repo}/blob/${encodeURIComponent(ref)}/${encodePath(path)}`
}

/** The file's raw bytes — what the server fetches, and where a relative image
 *  in a docs page is pointed. */
export function repoRawUrl(owner: string, repo: string, ref: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${encodePath(path)}`
}

/** What `docLinkTarget` needs from the page that renders the docs: how to build
 *  the site's own URLs (locale-aware, so they come from the caller) and where
 *  the repo is. */
export interface DocLinkContext {
  page:    (key: string) => string
  landing: string
  repo:    { owner: string; repo: string; ref: string }
}

/**
 * The `href` a classified link should render with, or null when it should
 * render as plain text. Only `http(s)` and `mailto` survive as external
 * targets — a `javascript:` link in a doc is dropped, not trusted.
 */
export function docLinkTarget(link: DocLink, ctx: DocLinkContext): string | null {
  switch (link.kind) {
    case 'anchor':   return link.hash
    case 'external': return /^(?:https?:|mailto:)/i.test(link.href) ? link.href : null
    case 'page':     return ctx.page(link.key) + link.hash
    case 'landing':  return ctx.landing + link.hash
    case 'repo':     return repoBlobUrl(ctx.repo.owner, ctx.repo.repo, ctx.repo.ref, link.path) + link.hash
    case 'dead':     return null
  }
}

const SWITCHER_ITEM = String.raw`(?:\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))`
const SWITCHER_LINE = new RegExp(String.raw`^${SWITCHER_ITEM}(?:\s*·\s*${SWITCHER_ITEM})+\s*$`)

/**
 * Drops the language-switcher line mdBook-style docs carry under the title
 * (`[Русский](ru/guide.md) · **English** · [日本語](ja/guide.md)`). On GitHub it
 * is how you change language; here the site's own switch does that, and the
 * line's links would otherwise lead out to untranslated files.
 *
 * Only a line made of nothing but bold/links separated by `·` counts, and only
 * near the top — prose that happens to contain a `·` is left alone.
 */
export function stripLangSwitcher(markdown: string): string {
  const lines = markdown.split('\n')
  const at = lines.slice(0, 6).findIndex(line => SWITCHER_LINE.test(line.replace(/\r$/, '')))
  if (at < 0) return markdown
  const dropBlank = lines[at + 1]?.trim() === '' ? 2 : 1
  lines.splice(at, dropBlank)
  return lines.join('\n')
}

/* ── API payloads ────────────────────────────────────────────────────────── */

/** `GET /api/project/:slug/docs` — the nav index plus every page's headings,
 *  which is all the sidebar and the docs search need. Both languages in one
 *  response, like every other bilingual payload on the site. */
export interface DocsIndexPayload extends DocsIndex {
  headings: Record<string, { en: MdHeading[]; ru: MdHeading[] | null }>
}

/** `GET /api/project/:slug/docs/:page` — one page's markdown source, as
 *  written in the repo. Relative links and images are the renderer's job. */
export interface DocsPagePayload {
  key:   string
  title: DocsPage['title']
  path:  DocsPage['path']
  body:  { en: string; ru: string | null }
}
