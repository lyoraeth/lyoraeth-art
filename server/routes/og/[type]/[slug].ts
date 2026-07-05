import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { createSanityClient } from '../../../utils/sanity'
import { onestLat400, onestCyr400, onestLat700, onestCyr700, jbMono } from '../../../utils/ogFonts'

/** Satori/resvg dynamic OG image for post & work detail pages — the branded
 *  fallback used when a document has no cover (see useArticleSeo). 1200×630,
 *  editorial layout, bilingual via ?l=ru|en. Cached 1h. */

// satori font list — Latin + Cyrillic Onest subsets under one name so its
// font-fallback picks the right glyph per character (EN + RU).
const b64 = (s: string) => Buffer.from(s, 'base64')
const FONTS = [
  { name: 'Onest', data: b64(onestLat400), weight: 400 as const, style: 'normal' as const },
  { name: 'Onest', data: b64(onestCyr400), weight: 400 as const, style: 'normal' as const },
  { name: 'Onest', data: b64(onestLat700), weight: 700 as const, style: 'normal' as const },
  { name: 'Onest', data: b64(onestCyr700), weight: 700 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: b64(jbMono), weight: 500 as const, style: 'normal' as const },
]

// tiny hyperscript for satori's vnode shape
const h = (type: string, props: any, ...kids: any[]): any => ({
  type,
  props: { ...props, children: kids.flat().filter(k => k != null) },
})

const C = {
  void: '#0A0C10', deep: '#0E1218', ink: '#E8EAEE',
  faint: '#5B6573', ember: '#D69A6A', line: 'rgba(255,255,255,0.10)',
}

function template({ title, eyebrow, meta }: { title: string; eyebrow: string; meta: string }) {
  return h('div', {
    style: {
      display: 'flex', flexDirection: 'column', width: '1200px', height: '630px',
      padding: '80px', justifyContent: 'space-between',
      backgroundColor: C.void,
      backgroundImage: `radial-gradient(120% 90% at 50% -20%, ${C.deep} 0%, ${C.void} 60%), radial-gradient(50% 60% at 12% 8%, rgba(21,65,79,0.35), transparent 70%)`,
    },
  },
    // top row — wordmark + rubric
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('div', { style: { display: 'flex', fontFamily: 'Onest', fontWeight: 700, fontSize: '30px', color: C.ink, letterSpacing: '-0.5px' } }, 'lyoraeth'),
      h('div', { style: { display: 'flex', fontFamily: 'JetBrains Mono', fontSize: '22px', color: C.faint, letterSpacing: '4px' } }, eyebrow),
    ),
    // title — clamped to 3 lines
    h('div', {
      style: {
        display: 'flex', fontFamily: 'Onest', fontWeight: 700, fontSize: '66px',
        color: C.ink, lineHeight: 1.12, letterSpacing: '-1.5px', maxWidth: '1000px',
        // @ts-expect-error satori-specific
        lineClamp: 3,
      },
    }, title),
    // bottom — ember tick + mono meta
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '18px' } },
      h('div', { style: { display: 'flex', width: '34px', height: '4px', backgroundColor: C.ember } }),
      h('div', { style: { display: 'flex', fontFamily: 'JetBrains Mono', fontSize: '24px', color: C.faint } }, meta),
    ),
  )
}

export default defineCachedEventHandler(async (event) => {
  const type    = getRouterParam(event, 'type')
  const slugRaw = getRouterParam(event, 'slug') || ''
  const slug    = decodeURIComponent(slugRaw).replace(/\.png$/, '')
  const locale  = getQuery(event).l === 'ru' ? 'ru' : 'en'

  if (type !== 'writing' && type !== 'work') throw createError({ statusCode: 404 })

  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) throw createError({ statusCode: 503, message: 'CMS not configured' })
  const client = createSanityClient(sanityProjectId, sanityDataset)

  let eyebrow: string
  let meta: string
  let titleObj: { en: string; ru?: string } | undefined

  if (type === 'writing') {
    const doc = await client.fetch<{ title: { en: string; ru?: string }; publishedAt: string; readingTime: number } | null>(
      `*[_type == "post" && slug.current == $s][0]{ title, publishedAt, readingTime }`, { s: slug },
    )
    if (!doc) throw createError({ statusCode: 404 })
    titleObj = doc.title
    eyebrow  = locale === 'ru' ? 'БЛОГ' : 'BLOG'
    const date = new Date(doc.publishedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).replace(/\s*г\.$/, '') // ru locale appends " г." — drop it
    meta = `${date} · ${doc.readingTime} ${locale === 'ru' ? 'мин' : 'min'}`
  } else {
    const doc = await client.fetch<{ title: { en: string; ru?: string }; kicker?: { en: string; ru?: string }; year?: number } | null>(
      `*[_type == "work" && coalesce(slug.current, _id) == $s][0]{ title, kicker, year }`, { s: slug },
    )
    if (!doc) throw createError({ statusCode: 404 })
    titleObj = doc.title
    eyebrow  = locale === 'ru' ? 'РАБОТА' : 'WORK'
    const kick = locale === 'ru' ? (doc.kicker?.ru ?? doc.kicker?.en) : doc.kicker?.en
    meta = [kick, doc.year].filter(Boolean).join(' · ')
  }

  const title = (locale === 'ru' && titleObj?.ru ? titleObj.ru : titleObj?.en) ?? ''

  const svg = await satori(template({ title, eyebrow, meta }), { width: 1200, height: 630, fonts: FONTS })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  setHeader(event, 'content-type', 'image/png')
  return png
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const l = getQuery(event).l === 'ru' ? 'ru' : 'en'
    return `og-${getRouterParam(event, 'type')}-${getRouterParam(event, 'slug')}-${l}`
  },
})
