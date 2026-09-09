/** GET /api/posts — published posts newest-first. `?limit=N` caps the count;
 *  `limit=0` (or negative) returns the full list. Empty when CMS unconfigured. */
export default defineEventHandler(async event => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const { limit = '3' } = getQuery(event) as { limit?: string }
  const n = parseInt(limit)
  const slice = n > 0 ? `[0...${n}]` : ''

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const items = await client.fetch<RawPost[]>(`
    *[_type == "post"] | order(publishedAt desc) ${slice} {
      _id,
      "slug": slug.current,
      publishedAt,
      readingTime,
      popularity,
      topic,
      tags,
      title,
      excerpt,
      "coverUrl": cover.asset->url,
      "coverAlt": cover.alt,
      // only pulled when there is no hand-written excerpt to fall back from
      "bodyEn": select(!defined(excerpt.en) => body, null),
      "bodyRu": select(!defined(excerpt.ru) => bodyRu, null)
    }
  `)

  return items.map(({ bodyEn, bodyRu, ...post }): PostItem => ({
    ...post,
    excerpt: {
      en: post.excerpt?.en || (bodyEn ? mdExcerpt(bodyEn, EXCERPT_MAX) : ''),
      ru: post.excerpt?.ru || (bodyRu ? mdExcerpt(bodyRu, EXCERPT_MAX) : null),
    },
  }))
})

/** Card excerpts are written to this length; the generated fallback matches it. */
const EXCERPT_MAX = 240

type RawPost = PostItem & { bodyEn: string | null; bodyRu: string | null }

export interface PostItem {
  _id:         string
  slug:        string
  publishedAt: string
  readingTime: number
  popularity:  number
  /** Single label above the card title — one per post, unlike tags. */
  topic:       { en: string; ru: string } | null
  tags:        string[]
  title:       { en: string; ru: string }
  /** From the CMS when written, otherwise derived from the body. */
  excerpt:     { en: string; ru: string | null }
  coverUrl:    string | null
  coverAlt:    string | null
}
