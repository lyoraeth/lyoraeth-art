export interface CommentItem {
  _id:         string
  nick:        string
  message:     string
  publishedAt: string
}

/** GET /api/comments/:slug — approved comments for a post, oldest-first.
 *  Only `approved == true` docs are returned; empty when CMS unconfigured. */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return []

  const client = createSanityClient(sanityProjectId, sanityDataset)

  return client.fetch<CommentItem[]>(`
    *[_type == "comment" && postSlug == $slug && approved == true]
    | order(publishedAt asc) {
      _id, nick, message, publishedAt
    }
  `, { slug })
})
