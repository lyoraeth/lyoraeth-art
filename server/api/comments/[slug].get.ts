export interface CommentItem {
  _id:         string
  name:        string
  email:       string
  message:     string
  publishedAt: string
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<CommentItem[]>(`
    *[_type == "comment" && postSlug == $slug && approved == true]
    | order(publishedAt asc) {
      _id, name, email, message, publishedAt
    }
  `, { slug })
})
