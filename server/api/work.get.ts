export default defineEventHandler(async (event) => {
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
      kicker,
      shortDescription,
      description,
      tags,
      tagWarm,
      url,
      showLink,
      year,
      "coverUrl": cover.asset->url,
      "coverAlt": cover.alt
    }
  `)
})

export interface WorkItem {
  _id:         string
  slug:        string
  title:       { en: string; ru: string }
  kicker:      { en: string; ru: string }
  shortDescription: { en: string; ru: string } | null
  description: { en: string; ru: string }
  tags:        string[]
  tagWarm:     string | null
  url?:        string
  showLink?:   boolean
  year?:       number
  coverUrl:    string | null
  coverAlt:    string | null
  coverWidth:  number | null
  coverHeight: number | null
}
