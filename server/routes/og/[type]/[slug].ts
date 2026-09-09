import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { createSanityClient } from '../../../utils/sanity'
import { OG_FONTS, ogCard } from '../../../utils/ogTemplate'

/** Satori/resvg dynamic OG image for post & work detail pages — the branded
 *  link-preview card used as og:image when a document has no cover (see
 *  useArticleSeo). 1200×630, light theme, bilingual via ?l=ru|en. Cached 1h.
 *
 *  The render itself is cached separately from the event handler, as a plain
 *  base64 string rather than the raw PNG buffer.
 *
 *  defineCachedEventHandler round-trips its return value through unstorage,
 *  which serializes a cache entry with JSON.stringify — fine for a string,
 *  but a Buffer survives that as `{"type":"Buffer","data":[...]}` and is
 *  never turned back into a real Buffer on a cache hit. That JSON text, not
 *  binary PNG, is what shipped as the body (Content-Type still said
 *  image/png) — Telegram's link-preview fetcher just hung on it forever.
 *  A string cached this way round-trips perfectly; the outer handler below
 *  decodes it back to bytes on every request, cached or not. */
const renderOgImage = defineCachedFunction(async (type: 'writing' | 'work', slug: string, locale: 'en' | 'ru') => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig()
  if (!sanityProjectId) throw createError({ statusCode: 503, message: 'CMS not configured' })
  const client = createSanityClient(sanityProjectId, sanityDataset)

  let title: string
  let caption: string[]

  if (type === 'writing') {
    const doc = await client.fetch<{ title: { en: string; ru?: string }; topic?: { en: string; ru?: string } | null } | null>(
      `*[_type == "post" && slug.current == $s][0]{ title, topic }`, { s: slug },
    )
    if (!doc) throw createError({ statusCode: 404 })
    title   = (locale === 'ru' && doc.title.ru ? doc.title.ru : doc.title.en) ?? ''
    const topic = locale === 'ru' ? (doc.topic?.ru ?? doc.topic?.en) : doc.topic?.en
    caption = topic ? [topic] : []
  }
  else {
    const doc = await client.fetch<{ title: { en: string; ru?: string }; teaser?: { en: string; ru?: string } | null } | null>(
      `*[_type == "work" && coalesce(slug.current, _id) == $s][0]{ title, teaser }`, { s: slug },
    )
    if (!doc) throw createError({ statusCode: 404 })
    title   = (locale === 'ru' && doc.title.ru ? doc.title.ru : doc.title.en) ?? ''
    const teaser = locale === 'ru' ? (doc.teaser?.ru ?? doc.teaser?.en) : doc.teaser?.en
    caption = teaser ? [teaser] : []
  }

  const svg = await satori(ogCard({ title, caption, link: 'Lyoraeth.art' }), { width: 1200, height: 630, fonts: OG_FONTS })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  return Buffer.from(png).toString('base64')
}, {
  maxAge: 60 * 60,
  name: 'og-image',
  getKey: (type, slug, locale) => `${type}-${slug}-${locale}`,
})

export default defineEventHandler(async event => {
  const type    = getRouterParam(event, 'type')
  const slugRaw = getRouterParam(event, 'slug') || ''
  const slug    = decodeURIComponent(slugRaw).replace(/\.png$/, '')
  const locale  = getQuery(event).l === 'ru' ? 'ru' : 'en'

  if (type !== 'writing' && type !== 'work') throw createError({ statusCode: 404 })

  const base64 = await renderOgImage(type, slug, locale)

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'max-age=3600')
  return Buffer.from(base64, 'base64')
})
