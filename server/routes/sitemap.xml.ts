import type { PostItem } from '../api/posts.get'
import type { WorkItem } from '../api/work.get'

const BASE = 'https://lyoraeth.art'

type Stamped = { _updatedAt?: string; publishedAt?: string }

/* Sanity timestamps are full ISO — sitemap only needs the date part. */
const stamp = (d?: string) => d?.slice(0, 10)

function url(loc: string, priority: string, changefreq: string, alt: { en: string; ru: string }, lastmod?: string) {
  const links =
    `<xhtml:link rel="alternate" hreflang="en" href="${alt.en}"/>` +
    `<xhtml:link rel="alternate" hreflang="ru" href="${alt.ru}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${alt.en}"/>`
  return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>${priority}</priority><changefreq>${changefreq}</changefreq>${links}</url>`
}

/* One path → EN + RU entries, each carrying the same set of alternate links. */
function pair(path: string, priority: string, changefreq: string, lastmod?: string) {
  const alt = { en: `${BASE}${path}`, ru: `${BASE}/ru${path}` }
  return [
    url(alt.en, priority, changefreq, alt, lastmod),
    url(alt.ru, priority, changefreq, alt, lastmod),
  ]
}

export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)

  let posts: (Pick<PostItem, 'slug'> & Stamped)[] = []
  let work:  (Pick<WorkItem, 'slug'> & Stamped)[] = []

  if (sanityProjectId) {
    const client = createSanityClient(sanityProjectId, sanityDataset)
    ;[posts, work] = await Promise.all([
      client.fetch('*[_type == "post"]{ "slug": slug.current, _updatedAt, publishedAt }'),
      client.fetch('*[_type == "work"]{ "slug": coalesce(slug.current, _id), _updatedAt }'),
    ])
  }

  const staticUrls = [
    ...pair('',         '1.0', 'weekly'),
    ...pair('/writing', '0.8', 'daily'),
    ...pair('/work',    '0.8', 'weekly'),
  ]

  const postUrls = posts.flatMap(p =>
    pair(`/writing/${p.slug}`, '0.6', 'monthly', stamp(p._updatedAt ?? p.publishedAt)),
  )

  const workUrls = work.flatMap(w =>
    pair(`/work/${w.slug}`, '0.6', 'monthly', stamp(w._updatedAt)),
  )

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...staticUrls,
    ...postUrls,
    ...workUrls,
    '</urlset>',
  ].join('\n')

  setHeader(event, 'Content-Type', 'application/xml')
  return xml
})
