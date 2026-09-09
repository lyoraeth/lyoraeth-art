/** GET /api/post/:slug — full post plus prev/next neighbours (by publish date).
 *  `excerpt` and `wordCount` are derived server-side from the EN/RU markdown so
 *  the client never ships the markdown pipeline twice. 404 when not found. */
export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId || !slug) return null

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const post = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      _updatedAt,
      "slug": slug.current,
      title,
      publishedAt,
      readingTime,
      topic,
      tags,
      "cmsExcerpt": excerpt,
      "coverUrl":    cover.asset->url,
      "coverAlt":    cover.alt,
      "coverWidth":  cover.asset->metadata.dimensions.width,
      "coverHeight": cover.asset->metadata.dimensions.height,
      references,
      "body": { "en": body, "ru": bodyRu },
      "prev": *[_type=="post" && publishedAt < ^.publishedAt] | order(publishedAt desc)[0]{ "slug": slug.current, title },
      "next": *[_type=="post" && publishedAt > ^.publishedAt] | order(publishedAt asc)[0]{ "slug": slug.current, title }
    }
  `, { slug })

  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })

  // hand-written where the CMS has it, derived otherwise — either way the page
  // never ships the markdown pipeline twice
  post.excerpt = {
    en: post.cmsExcerpt?.en || (post.body.en ? mdExcerpt(post.body.en) : ''),
    ru: post.cmsExcerpt?.ru || (post.body.ru ? mdExcerpt(post.body.ru) : null),
  }
  delete post.cmsExcerpt
  post.wordCount = post.body.en
    ? mdPlainText(post.body.en).split(/\s+/).filter(Boolean).length
    : 0

  return post as PostDetail
})

export interface AdjacentPost {
  slug:  string
  title: { en: string; ru: string }
}

export interface PostDetail {
  _id:         string
  _updatedAt:  string
  slug:        string
  title:       { en: string; ru: string }
  publishedAt: string
  readingTime: number
  tags:        string[]
  coverUrl:    string | null
  coverAlt:    string | null
  coverWidth:  number | null
  coverHeight: number | null
  body:        { en: string | null; ru: string | null }
  excerpt:     { en: string; ru: string | null }
  wordCount:   number
  references:  { title: string; href: string }[] | null
  prev:        AdjacentPost | null
  next:        AdjacentPost | null
}
