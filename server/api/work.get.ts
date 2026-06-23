export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<WorkItem[]>(`
    *[_type == "work"] | order(order asc, _createdAt desc) [0...3] {
      _id,
      title,
      kicker,
      description,
      tags,
      tagWarm,
      url,
      "coverUrl": cover.asset->url
    }
  `)
})

export interface WorkItem {
  _id:         string
  title:       { en: string; ru: string }
  kicker:      { en: string; ru: string }
  description: { en: string; ru: string }
  tags:        string[]
  tagWarm:     string
  url?:        string
  coverUrl:    string | null
}
