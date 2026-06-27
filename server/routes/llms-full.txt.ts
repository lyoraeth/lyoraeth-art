const BASE = 'https://lyoraeth.art'

export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)

  let work:  any[] = []
  let posts: any[] = []

  if (sanityProjectId) {
    const client = createSanityClient(sanityProjectId, sanityDataset)
    ;[work, posts] = await Promise.all([
      client.fetch<any[]>(`
        *[_type == "work"] | order(order asc) {
          "slug": coalesce(slug.current, _id),
          title, kicker, description, tags, tagWarm, url, year
        }
      `),
      client.fetch<any[]>(`
        *[_type == "post"] | order(publishedAt desc) {
          "slug": slug.current,
          title, publishedAt, readingTime, tags, body
        }
      `),
    ])
  }

  const lines: string[] = []

  lines.push('# lyoraeth.art — Full content index')
  lines.push('')
  lines.push('> Personal portfolio of Danil Klimov — Frontend Developer specializing in Vue, TypeScript, and animation.')
  lines.push('> Available for remote projects from July 2026.')
  lines.push('')
  lines.push(`> Site: ${BASE}  |  Contact: ${BASE}/#contact  |  Telegram: @lyoraeth`)
  lines.push('')

  // ── Work ──────────────────────────────────────────────────────────────────
  if (work.length) {
    lines.push('---')
    lines.push('')
    lines.push('## Work')
    lines.push('')

    for (const item of work) {
      lines.push(`### ${item.title?.en ?? 'Untitled'}`)
      if (item.kicker?.en)       lines.push(`*${item.kicker.en}*`)
      if (item.year)             lines.push(`Year: ${item.year}`)
      const tags = [item.tagWarm, ...(item.tags ?? [])].filter(Boolean)
      if (tags.length)           lines.push(`Tags: ${tags.join(', ')}`)
      if (item.description?.en)  lines.push('', item.description.en)
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
