export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<PostItem[]>(`
    *[_type == "post"] | order(publishedAt desc) [0...3] {
      _id,
      "slug": slug.current,
      publishedAt,
      readingTime,
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
  tags:        string[]
  title:       { en: string; ru: string }
  coverUrl:    string | null
}
