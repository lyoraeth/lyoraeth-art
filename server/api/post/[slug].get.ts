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
      "coverUrl": cover.asset->url,
      body[] {
        ...,
        _type == "image" => {
          ...,
          "url": asset->url,
          "width":  asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height
        }
      }
    }
  `, { slug })

  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  return post
})
