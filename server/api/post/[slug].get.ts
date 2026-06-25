export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId || !slug) return null

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const post = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      "slug": slug.current,
      title,
      publishedAt,
      readingTime,
      tags,
      "coverUrl":    cover.asset->url,
      "coverAlt":    cover.alt,
      "coverWidth":  cover.asset->metadata.dimensions.width,
      "coverHeight": cover.asset->metadata.dimensions.height,
      "body": {
        "en": body[] {
          ...,
          _type == "image" => {
            ...,
            "url": asset->url,
            "alt": alt,
            "width":  asset->metadata.dimensions.width,
            "height": asset->metadata.dimensions.height
          }
        },
        "ru": bodyRu[] {
          ...,
          _type == "image" => {
            ...,
            "url": asset->url,
            "alt": alt,
            "width":  asset->metadata.dimensions.width,
            "height": asset->metadata.dimensions.height
          }
        }
      }
    }
  `, { slug })

  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  return post as PostDetail
})

export interface PostDetail {
  _id:         string
  slug:        string
  title:       { en: string; ru: string }
  publishedAt: string
  readingTime: number
  tags:        string[]
  coverUrl:    string | null
  coverAlt:    string | null
  coverWidth:  number | null
  coverHeight: number | null
  body:        { en: unknown[]; ru: unknown[] | null }
}
