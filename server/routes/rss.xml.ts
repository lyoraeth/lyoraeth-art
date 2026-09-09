import type { H3Event } from 'h3'

const BASE = 'https://lyoraeth.art'

interface FeedPost {
  slug:        string
  title:       { en: string; ru: string | null }
  publishedAt: string
  body:        { en: string | null; ru: string | null }
}

const CHANNEL = {
  en: {
    title:       'lyoraeth — writing',
    description: 'Notes on frontend, design systems and shipping real products — by Danil Klimov.',
  },
  ru: {
    title:       'lyoraeth — блог',
    description: 'Заметки о фронтенде, дизайн-системах и доведении продуктов до результата — Данил Климов.',
  },
} as const

function esc(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Render the RSS 2.0 feed for one locale — shared between /rss.xml (EN) and
 *  /ru/rss.xml (RU). RU items fall back to EN title/body when the translation
 *  is missing; descriptions are markdown excerpts. Sets a 1h cache header. */
export async function renderFeed(event: H3Event, locale: 'en' | 'ru') {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)

  let posts: FeedPost[] = []

  if (sanityProjectId) {
    const client = createSanityClient(sanityProjectId, sanityDataset)
    posts = await client.fetch<FeedPost[]>(`
      *[_type == "post"] | order(publishedAt desc) {
        "slug": slug.current,
        title,
        publishedAt,
        "body": { "en": body, "ru": bodyRu }
      }
    `)
  }

  const prefix = locale === 'ru' ? '/ru' : ''

  const items = posts.map(post => {
    const link  = `${BASE}${prefix}/writing/${post.slug}`
    const title = (locale === 'ru' ? post.title.ru : null) ?? post.title.en
    const body  = (locale === 'ru' ? post.body.ru : null) ?? post.body.en ?? ''
    return [
      '    <item>',
      `      <title>${esc(title)}</title>`,
      `      <link>${esc(link)}</link>`,
      `      <guid>${esc(link)}</guid>`,
      `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
      `      <description>${esc(mdExcerpt(body))}</description>`,
      '    </item>',
    ].join('\n')
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${esc(CHANNEL[locale].title)}</title>`,
    `    <link>${BASE}${prefix}/writing</link>`,
    `    <description>${esc(CHANNEL[locale].description)}</description>`,
    `    <language>${locale}</language>`,
    ...items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  return xml
}

export default defineEventHandler(event => renderFeed(event, 'en'))
