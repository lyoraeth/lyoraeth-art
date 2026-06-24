import type { PostItem } from '../api/posts.get'
import type { WorkItem } from '../api/work.get'

const BASE = 'https://lyoraeth.art'

function url(loc: string, priority: string, changefreq: string) {
  return `  <url><loc>${loc}</loc><priority>${priority}</priority><changefreq>${changefreq}</changefreq></url>`
}

export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)

  let posts: PostItem[] = []
  let work:  WorkItem[] = []

  if (sanityProjectId) {
    const client = createSanityClient(sanityProjectId, sanityDataset)
    ;[posts, work] = await Promise.all([
      client.fetch<PostItem[]>('*[_type == "post"]{ "slug": slug.current }'),
      client.fetch<WorkItem[]>('*[_type == "work"]{ "slug": coalesce(slug.current, _id) }'),
    ])
  }

  const staticUrls = [
    url(BASE,           '1.0', 'weekly'),
    url(`${BASE}/writing`, '0.8', 'daily'),
    url(`${BASE}/work`,    '0.8', 'weekly'),
    url(`${BASE}/ru`,           '1.0', 'weekly'),
    url(`${BASE}/ru/writing`,   '0.8', 'daily'),
    url(`${BASE}/ru/work`,      '0.8', 'weekly'),
  ]

  const postUrls = posts.flatMap(p => [
    url(`${BASE}/writing/${p.slug}`,    '0.6', 'monthly'),
    url(`${BASE}/ru/writing/${p.slug}`, '0.6', 'monthly'),
  ])

  const workUrls = work.flatMap(w => [
    url(`${BASE}/work/${w.slug}`,    '0.6', 'monthly'),
    url(`${BASE}/ru/work/${w.slug}`, '0.6', 'monthly'),
  ])

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...postUrls,
    ...workUrls,
    '</urlset>',
  ].join('\n')

  setHeader(event, 'Content-Type', 'application/xml')
  return xml
})
