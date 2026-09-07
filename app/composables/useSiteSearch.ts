import type { PostItem } from '../../server/api/posts.get'
import type { WorkItem } from '../../server/api/work.get'

/** Small and fixed enough that a dedicated search endpoint isn't worth it — the
 *  whole catalog fits in two requests, fetched once and filtered client-side. */
const RESULT_LIMIT = 5

export interface SearchResult {
  key:   string
  href:  string
  title: string
  /** Secondary line — topic for a post, year for a work item, none for a page. */
  meta:  string | null
}

export interface SearchGroups {
  work:    SearchResult[]
  writing: SearchResult[]
  pages:   SearchResult[]
}

/** Site-wide search, shared by the header field and the phone search toggle. */
export function useSiteSearch() {
  const { t } = useI18n()
  const loc = useLoc()
  const localePath = useLocalePath()

  const posts   = useState<PostItem[]>('search-posts', () => [])
  const work    = useState<WorkItem[]>('search-work', () => [])
  const loading = useState('search-loading', () => false)
  const loaded  = useState('search-loaded', () => false)

  /** Fetches the two lists once per session; later calls are a no-op. `loaded`
   *  only flips once the request actually settles — the field opens the panel
   *  on focus, well before that, and a query typed in the gap must not show
   *  "nothing found" for lists that just haven't arrived yet. */
  async function ensureLoaded() {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      const [postsRes, workRes] = await Promise.all([
        $fetch<PostItem[]>('/api/posts', { query: { limit: 0 } }),
        $fetch<WorkItem[]>('/api/work', { query: { limit: 0 } }),
      ])
      posts.value = postsRes
      work.value = workRes
    } finally {
      // a failed fetch still counts as settled — search just stays empty,
      // not worth a dedicated error state for two small lists
      loading.value = false
      loaded.value = true
    }
  }

  // Only two of these exist — matched by title alone, there's nothing else
  // on them worth indexing.
  const pages = computed((): SearchResult[] => [
    { key: 'privacy', href: localePath('/privacy'), title: t('privacy.title'), meta: null },
    { key: 'personal-data', href: localePath('/personal-data'), title: t('personal_data.title'), meta: null },
  ])

  function search(query: string): SearchGroups {
    const q = query.trim().toLowerCase()
    if (!q) return { work: [], writing: [], pages: [] }

    const matchedWork = work.value
      .filter(w => loc(w.title).toLowerCase().includes(q) || w.tags.some(tag => tag.toLowerCase().includes(q)))
      .slice(0, RESULT_LIMIT)
      .map((w): SearchResult => ({
        key:   w._id,
        href:  localePath(`/work/${w.slug}`),
        title: loc(w.title),
        meta:  w.year ? String(w.year) : null,
      }))

    const matchedPosts = posts.value
      .filter(p =>
        loc(p.title).toLowerCase().includes(q) ||
        loc(p.topic).toLowerCase().includes(q) ||
        p.tags.some(tag => tag.toLowerCase().includes(q)),
      )
      .slice(0, RESULT_LIMIT)
      .map((p): SearchResult => ({
        key:   p._id,
        href:  localePath(`/writing/${p.slug}`),
        title: loc(p.title),
        meta:  loc(p.topic) || null,
      }))

    const matchedPages = pages.value.filter(p => p.title.toLowerCase().includes(q))

    return { work: matchedWork, writing: matchedPosts, pages: matchedPages }
  }

  return { ensureLoaded, search, ready: loaded }
}
