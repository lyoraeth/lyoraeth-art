const BASE = 'https://lyoraeth.art'

// Just the fields this route's own GROQ projections actually select — work's
// `body` is a genuine { en, ru } field on that schema, unlike a post's,
// which is a plain string (bodyRu lives in its own separate field there).
interface LlmsWorkItem {
  slug:    string
  title?:  { en?: string }
  teaser?: { en?: string }
  excerpt?: { en?: string }
  body?:   { en?: string } | null
  tags?:   string[]
  url?:    string
  year?:   number
}
interface LlmsPostItem {
  slug:    string
  title?:  { en?: string }
  publishedAt?: string
  readingTime?: number
  topic?:  { en?: string }
  tags?:   string[]
  body?:   string | null
}

/** GET /llms-full.txt — plain-text index of all work + writing (EN, full post
 *  bodies inline) for LLM crawlers. Empty-ish when the CMS is unconfigured. */
export default defineEventHandler(async event => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)

  let work:  LlmsWorkItem[] = []
  let posts: LlmsPostItem[] = []

  if (sanityProjectId) {
    const client = createSanityClient(sanityProjectId, sanityDataset)
    ;[work, posts] = await Promise.all([
      client.fetch<LlmsWorkItem[]>(`
        *[_type == "work"] | order(order asc) {
          "slug": coalesce(slug.current, _id),
          title, teaser, excerpt, body, tags, url, year
        }
      `),
      client.fetch<LlmsPostItem[]>(`
        *[_type == "post"] | order(publishedAt desc) {
          "slug": slug.current,
          title, publishedAt, readingTime, topic, tags, body
        }
      `),
    ])
  }

  const lines: string[] = []

  lines.push('# lyoraeth.art — full content index')
  lines.push('')
  lines.push('> Personal site of Danil Klimov. Frontend developer and writer on how websites work. Interfaces, animation, legacy. Vue, TypeScript, Nuxt. Saint Petersburg, on-site or remote.')
  lines.push('> Everything below is the English version; the site also runs in Russian under /ru/.')
  lines.push('')
  lines.push(`> Site: ${BASE}  |  Contact: ${BASE}/#contact  |  Telegram: @lyoraeth_art`)
  lines.push('')

  // ── Work ──────────────────────────────────────────────────────────────────
  if (work.length) {
    lines.push('---')
    lines.push('')
    lines.push('## Work')
    lines.push('')

    for (const item of work) {
      lines.push(`### ${item.title?.en ?? 'Untitled'}`)
      if (item.teaser?.en)       lines.push(`*${item.teaser.en}*`)
      if (item.year)             lines.push(`Year: ${item.year}`)
      const tags = item.tags ?? []
      if (tags.length)           lines.push(`Tags: ${tags.join(', ')}`)
      if (item.body?.en)         lines.push('', item.body.en)
      else if (item.excerpt?.en) lines.push('', item.excerpt.en)
      if (item.url)              lines.push('', `URL: ${item.url}`)
      lines.push(`Case page: ${BASE}/work/${item.slug}`)
      lines.push('')
    }
  }

  // ── Writing ───────────────────────────────────────────────────────────────
  if (posts.length) {
    lines.push('---')
    lines.push('')
    lines.push('## Writing')
    lines.push('')

    for (const post of posts) {
      lines.push(`### ${post.title?.en ?? 'Untitled'}`)
      if (post.publishedAt) lines.push(`Published: ${new Date(post.publishedAt).toISOString().slice(0, 10)}`)
      if (post.readingTime) lines.push(`Reading time: ${post.readingTime} min`)
      if (post.topic?.en) lines.push(`Topic: ${post.topic.en}`)
      if (post.tags?.length) lines.push(`Tags: ${post.tags.join(', ')}`)
      lines.push(`URL: ${BASE}/writing/${post.slug}`)
      lines.push('')
      if (post.body && typeof post.body === 'string') {
        lines.push(post.body)
        lines.push('')
      }
    }
  }

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return lines.join('\n')
})
