/** GET /api/work — work items by manual order. `?limit=N` caps the count
 *  (`limit=0` returns all). Response cached 5 min, keyed by the limit param. */
export default defineCachedEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const { limit = '3' } = getQuery(event) as { limit?: string }
  const n = parseInt(limit)
  const slice = n > 0 ? `[0...${n}]` : ''

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<WorkItem[]>(`
    *[_type == "work"] | order(order asc, _createdAt desc) ${slice} {
      _id,
      "slug": coalesce(slug.current, _id),
      title,
      teaser,
      excerpt,
      tags,
      url,
      showLink,
      year,
      "coverUrl": cover.asset->url,
      "coverAlt": cover.alt
    }
  `)
}, { maxAge: 60 * 5, name: 'work-list', getKey: (event) => getQuery(event).limit ?? '3' })

export interface WorkItem {
  _id:         string
  slug:        string
  title:       { en: string; ru: string }
  /** One line under the title on a resting card. */
  teaser:      { en: string; ru: string } | null
  /** Replaces the teaser on hover, and carries the work listing. */
  excerpt:     { en: string; ru: string } | null
  tags:        string[]
  url?:        string
  showLink?:   boolean
  year?:       number
  coverUrl:    string | null
  coverAlt:    string | null
  coverWidth:  number | null
  coverHeight: number | null
}
