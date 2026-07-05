import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { createSanityClient } from '../../../utils/sanity'
import { onestLat400, onestCyr400, onestLat700, onestCyr700, jbMono } from '../../../utils/ogFonts'
import { logoPng } from '../../../utils/ogLogo'

/** Satori/resvg dynamic OG image for post & work detail pages. 1200×630,
 *  bilingual via ?l=ru|en. Two variants:
 *   • default — link-preview card (logo + rubric, title, ember tick + date/meta),
 *     used as og:image when a document has no cover (see useArticleSeo).
 *   • ?cover  — visible blog cover (logo + rubric + post tags, no title/date, since
 *     those already sit next to it as text). Falls back to a big centred logo.
 *  Cached 1h. */

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
  base: '#10151C', ink: '#E8EAEE', soft: '#C4CCD6',
  faint: '#5B6573', ember: '#D69A6A', line: 'rgba(255,255,255,0.14)',
}

// Lighter-than-black stage lit by a few coloured sources (teal, indigo, warm
// ember), plus a soft bottom vignette to keep text legible — same palette as the
// site, just turned up a notch.
const BACKGROUND = [
  `radial-gradient(75% 85% at 6% -5%, rgba(46,116,128,0.34), transparent 60%)`,
  `radial-gradient(65% 75% at 104% 108%, rgba(96,78,158,0.30), transparent 55%)`,
  `radial-gradient(48% 60% at 88% 6%, rgba(214,154,106,0.16), transparent 62%)`,
  `radial-gradient(120% 110% at 50% 128%, #0A0E14 0%, transparent 55%)`,
].join(', ')

// wordmark logo (transparent PNG). aspect ≈ 1056:423 (2.4965:1)
const LOGO_AR = 1056 / 423
const logoSrc = `data:image/png;base64,${logoPng}`
const logo = (w: number) => {
  const height = Math.round(w / LOGO_AR)
  return h('img', { src: logoSrc, width: w, height, style: { display: 'flex', width: `${w}px`, height: `${height}px` } })
}

const stage = (children: any[]) =>
  h('div', {
    style: {
      display: 'flex', flexDirection: 'column', width: '1200px', height: '630px',
      padding: '80px', justifyContent: 'space-between',
      backgroundColor: C.base, backgroundImage: BACKGROUND,
    },
  }, children)

const rubric = (eyebrow: string) =>
  h('div', { style: { display: 'flex', fontFamily: 'JetBrains Mono', fontSize: '22px', color: C.faint, letterSpacing: '4px' } }, eyebrow)

/** Link-preview variant — logo + rubric, title, ember tick + date/meta. */
function templateOg({ title, eyebrow, meta }: { title: string; eyebrow: string; meta: string }) {
  return stage([
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      logo(150), rubric(eyebrow),
    ),
    h('div', {
      style: {
        display: 'flex', fontFamily: 'Onest', fontWeight: 700, fontSize: '66px',
        color: C.ink, lineHeight: 1.12, letterSpacing: '-1.5px', maxWidth: '1000px',
        lineClamp: 3,
      },
    }, title),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '18px' } },
      h('div', { style: { display: 'flex', width: '34px', height: '4px', backgroundColor: C.ember } }),
      h('div', { style: { display: 'flex', fontFamily: 'JetBrains Mono', fontSize: '24px', color: C.faint } }, meta),
    ),
  ])
}

/** Cover variant — rubric, centred logo, post tags. No title/date (they sit next
 *  to the cover as text). With no tags it's just the big logo, still on-brand. */
function templateCover({ eyebrow, tags }: { eyebrow: string; tags: string[] }) {
  return stage([
    rubric(eyebrow),
    h('div', { style: { display: 'flex', flex: '1', alignItems: 'center', justifyContent: 'center' } },
      logo(360),
    ),
    tags.length
      ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '16px' } },
          tags.slice(0, 6).map(tag =>
            h('div', {
              style: {
                display: 'flex', fontFamily: 'JetBrains Mono', fontSize: '30px', color: C.soft,
                padding: '12px 22px', border: `1px solid ${C.line}`, borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.03)',
              },
            }, tag),
          ),
        )
      : h('div', { style: { display: 'flex', width: '34px', height: '4px', backgroundColor: C.ember } }),
  ])
}

export default defineCachedEventHandler(async (event) => {
  const type    = getRouterParam(event, 'type')
  const slugRaw = getRouterParam(event, 'slug') || ''
  const slug    = decodeURIComponent(slugRaw).replace(/\.png$/, '')
  const locale  = getQuery(event).l === 'ru' ? 'ru' : 'en'
  const cover   = getQuery(event).cover != null

  if (type !== 'writing' && type !== 'work') throw createError({ statusCode: 404 })

  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) throw createError({ statusCode: 503, message: 'CMS not configured' })
  const client = createSanityClient(sanityProjectId, sanityDataset)

  let eyebrow: string
  let meta: string
  let tags: string[] = []
  let titleObj: { en: string; ru?: string } | undefined

  if (type === 'writing') {
    const doc = await client.fetch<{ title: { en: string; ru?: string }; publishedAt: string; readingTime: number; tags?: string[] } | null>(
      `*[_type == "post" && slug.current == $s][0]{ title, publishedAt, readingTime, tags }`, { s: slug },
    )
    if (!doc) throw createError({ statusCode: 404 })
    titleObj = doc.title
    tags     = doc.tags ?? []
    eyebrow  = locale === 'ru' ? 'БЛОГ' : 'BLOG'
    const date = new Date(doc.publishedAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).replace(/\s*г\.$/, '') // ru locale appends " г." — drop it
    meta = `${date} · ${doc.readingTime} ${locale === 'ru' ? 'мин' : 'min'}`
  } else {
    const doc = await client.fetch<{ title: { en: string; ru?: string }; kicker?: { en: string; ru?: string }; year?: number; tags?: string[] } | null>(
      `*[_type == "work" && coalesce(slug.current, _id) == $s][0]{ title, kicker, year, tags }`, { s: slug },
    )
    if (!doc) throw createError({ statusCode: 404 })
    titleObj = doc.title
    tags     = doc.tags ?? []
    eyebrow  = locale === 'ru' ? 'РАБОТА' : 'WORK'
    const kick = locale === 'ru' ? (doc.kicker?.ru ?? doc.kicker?.en) : doc.kicker?.en
    meta = [kick, doc.year].filter(Boolean).join(' · ')
  }

  const title = (locale === 'ru' && titleObj?.ru ? titleObj.ru : titleObj?.en) ?? ''

  const vnode = cover ? templateCover({ eyebrow, tags }) : templateOg({ title, eyebrow, meta })
  const svg = await satori(vnode, { width: 1200, height: 630, fonts: FONTS })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  setHeader(event, 'content-type', 'image/png')
  return png
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const l = getQuery(event).l === 'ru' ? 'ru' : 'en'
    const c = getQuery(event).cover != null ? 'c' : 'o'
    return `og-${getRouterParam(event, 'type')}-${getRouterParam(event, 'slug')}-${l}-${c}`
  },
})
