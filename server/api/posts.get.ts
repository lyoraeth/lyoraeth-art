export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const { limit = '3' } = getQuery(event) as { limit?: string }
  const n = parseInt(limit)
  const slice = n > 0 ? `[0...${n}]` : ''

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<PostItem[]>(`
    *[_type == "post"] | order(publishedAt desc) ${slice} {
      _id,
      "slug": slug.current,
      publishedAt,
      readingTime,
      popularity,
      tags,
      title,
      "coverUrl": cover.asset->url
    }
  `)
})

export interface PostItem {
  _id:         string
  slug:        string
  publishedAt: string
  readingTime: number
  popularity:  number
  tags:        string[]
  title:       { en: string; ru: string }
  coverUrl:    string | null
}
