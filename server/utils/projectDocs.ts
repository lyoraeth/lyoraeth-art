import {
  DOCS_REF, parseRepoUrl, parseSummary, buildDocsIndex, docsPages,
  type DocsIndexPayload, type DocsPagePayload,
} from '#shared/docs'
import { extractHeadings } from '#shared/markdown'

/** The storage mount the docs' cache lives in — a directory on the media volume
 *  (see `nitro.storage` in nuxt.config), so it outlives a restart. Bump the
 *  version in the cached functions' names when a payload's shape changes: an
 *  entry written by older code would otherwise be served to newer code. */
const DOCS_CACHE = 'docs-cache'

/** Where a project's docs live: enough to fetch them, nothing the visitor
 *  controls. */
export interface DocsSource {
  owner:    string
  repo:     string
  ref:      string
  docsPath: string
}

/**
 * The docs source for a project slug, from the CMS — or a 404 when the
 * project doesn't exist, has docs switched off, or points at a repo that
 * isn't one of ours.
 *
 * The owner allowlist (`parseRepoUrl`) and the path shape are checked here
 * again even though the Studio schema validates both: the fetched markdown is
 * rendered through `v-html`, so a hand-edited or imported document must not be
 * able to aim the site at someone else's repo.
 */
export async function resolveDocsSource(slug: string): Promise<DocsSource> {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig()
  const notFound = () => createError({ statusCode: 404, message: 'Docs not found' })
  if (!sanityProjectId) throw notFound()

  const client = createSanityClient(sanityProjectId, sanityDataset)
  const project = await client.fetch<{ repoUrl?: string; hasDocs?: boolean; docsPath?: string } | null>(`
    *[_type == "project" && (slug.current == $slug || _id == $slug)][0] {
      repoUrl, hasDocs, "docsPath": coalesce(docsPath, "docs")
    }
  `, { slug })

  const repo = parseRepoUrl(project?.repoUrl)
  const docsPath = project?.docsPath ?? ''
  if (!project?.hasDocs || !repo || !/^[\w-]+(\/[\w-]+)*$/.test(docsPath)) throw notFound()

  return { ...repo, ref: DOCS_REF, docsPath }
}

/** After a failed fetch the same resource is not asked again for this long. */
const FAILURE_WINDOW_MS = 60_000
const failures = createFailureMemo(FAILURE_WINDOW_MS)

/**
 * A failed upstream is the site's 502, not a stack trace. The error itself is
 * never cached (a thrown error isn't stored), so the failure is remembered
 * here instead: within the window the next requests answer 502 at once, not
 * after another timeout, and GitHub isn't hit again while it is refusing us.
 * Success — including one served from the cache — clears it.
 *
 * @param resourceKey - what failed: one resource (the index, one page), not the
 * whole repo — a page that isn't cached and fails must not shut out the index
 * or another page that the cache can still serve
 */
export async function docsGuard<T>(resourceKey: string, load: () => Promise<T>): Promise<T> {
  const unavailable = () => createError({ statusCode: 502, message: 'Docs are temporarily unavailable' })
  if (failures.isBlocked(resourceKey)) throw unavailable()

  try {
    const result = await load()
    failures.clear(resourceKey)
    return result
  }
  catch (error) {
    if (error instanceof DocsFetchError) {
      failures.record(resourceKey)
      console.error('[docs]', error.message)
      throw unavailable()
    }
    throw error
  }
}

/**
 * The nav index and every page's headings, for both locales.
 *
 * Built from the repo's `SUMMARY.md` (`docs/SUMMARY.md` and
 * `docs/ru/SUMMARY.md`) and one fetch per page for its headings, all cached
 * for 30 minutes — and served stale for a day while GitHub is unreachable,
 * rather than failing the page. A single page that fails to load just gets no
 * headings for the cache window; it still appears in the nav.
 */
export const loadDocsIndex = defineCachedFunction(async (
  owner: string, repo: string, ref: string, docsPath: string,
): Promise<DocsIndexPayload> => {
  const [enSummary, ruSummary] = await Promise.all([
    fetchRawFile(owner, repo, ref, `${docsPath}/SUMMARY.md`),
    fetchRawFile(owner, repo, ref, `${docsPath}/ru/SUMMARY.md`),
  ])
  if (enSummary === null) throw createError({ statusCode: 404, message: 'Docs not found' })

  const index = buildDocsIndex(
    parseSummary(enSummary, docsPath),
    ruSummary === null ? null : parseSummary(ruSummary, `${docsPath}/ru`),
  )

  const headings: DocsIndexPayload['headings'] = {}
  await Promise.all(docsPages(index).filter(p => !p.landing).map(async page => {
    const [en, ru] = await Promise.all([
      fetchRawFile(owner, repo, ref, page.path.en).catch(() => null),
      page.path.ru ? fetchRawFile(owner, repo, ref, page.path.ru).catch(() => null) : null,
    ])
    headings[page.key] = {
      en: en === null ? [] : extractHeadings(en),
      ru: ru === null ? null : extractHeadings(ru),
    }
  }))

  return { ...index, headings }
}, {
  maxAge: 60 * 30,
  base: DOCS_CACHE,
  staleMaxAge: 60 * 60 * 24,
  name: 'project-docs-index-v1',
  getKey: (owner, repo, ref, docsPath) => `${owner}/${repo}/${ref}/${docsPath}`,
})

/** One docs page's markdown, both locales. The RU body is null when the repo
 *  has no RU file for it (or the trees couldn't be paired) — the site then
 *  shows the EN text. */
export const loadDocsPage = defineCachedFunction(async (
  owner: string, repo: string, ref: string, docsPath: string, key: string,
): Promise<DocsPagePayload> => {
  const index = await loadDocsIndex(owner, repo, ref, docsPath)
  const page = docsPages(index).find(p => p.key === key && !p.landing)
  if (!page) throw createError({ statusCode: 404, message: 'Docs page not found' })

  const [en, ru] = await Promise.all([
    fetchRawFile(owner, repo, ref, page.path.en),
    page.path.ru ? fetchRawFile(owner, repo, ref, page.path.ru) : null,
  ])
  if (en === null) throw createError({ statusCode: 404, message: 'Docs page not found' })

  return { key: page.key, title: page.title, path: page.path, body: { en, ru } }
}, {
  maxAge: 60 * 30,
  base: DOCS_CACHE,
  staleMaxAge: 60 * 60 * 24,
  name: 'project-docs-page-v1',
  getKey: (owner, repo, ref, docsPath, key) => `${owner}/${repo}/${ref}/${docsPath}/${key}`,
})

/**
 * The repo's latest release, or null — the docs header shows it when there is
 * one. Cached for 30 minutes and served stale for a day, like the docs
 * themselves: the unauthenticated GitHub API allows 60 requests an hour per
 * address, so it is asked rarely.
 */
export const loadLatestRelease = defineCachedFunction(
  (owner: string, repo: string) => fetchLatestRelease(owner, repo),
  {
    maxAge: 60 * 30,
    base: DOCS_CACHE,
    staleMaxAge: 60 * 60 * 24,
    name: 'project-latest-release-v1',
    getKey: (owner, repo) => `${owner}/${repo}`,
  },
)
