/** GET /api/project — projects by manual order. `?limit=N` caps the count
 *  (`limit=0` returns all). Response cached 5 min, keyed by the limit param. */
export default defineCachedEventHandler(async event => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const { limit = '3' } = getQuery(event) as { limit?: string }
  const n = parseInt(limit)
  const slice = n > 0 ? `[0...${n}]` : ''

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<ProjectItem[]>(`
    *[_type == "project"] | order(order asc, _createdAt desc) ${slice} {
      _id,
      "slug": coalesce(slug.current, _id),
      title,
      teaser,
      excerpt,
      tags,
      status,
      year,
      repoUrl,
      demoUrl,
      "hasDocs": coalesce(hasDocs, false),
      "logoUrl":     logo.asset->url,
      "coverUrl":    cover.asset->url,
      "coverAlt":    cover.alt,
      "coverWidth":  cover.asset->metadata.dimensions.width,
      "coverHeight": cover.asset->metadata.dimensions.height
    }
  `)
}, { maxAge: 60 * 5, name: 'project-list', getKey: event => String(getQuery(event).limit ?? '3') })

export type ProjectStatus = 'active' | 'maintained' | 'archived'

export interface ProjectItem {
  _id:         string
  slug:        string
  title:       { en: string; ru: string }
  /** One line under the title. */
  teaser:      { en: string; ru: string } | null
  /** The short pitch beside the screenshot. */
  excerpt:     { en: string; ru: string } | null
  tags:        string[]
  status:      ProjectStatus
  year?:       number
  repoUrl:     string
  demoUrl?:    string
  hasDocs:     boolean
  logoUrl:     string | null
  coverUrl:    string | null
  coverAlt:    string | null
  coverWidth:  number | null
  coverHeight: number | null
}
