import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { createSanityClient } from '../../../utils/sanity'
import { onestLat400, onestCyr400, onestLat700, onestCyr700, jbMono } from '../../../utils/ogFonts'
import { logoPng } from '../../../utils/ogLogo'

/** Satori/resvg dynamic OG image for post & work detail pages — the branded
 *  link-preview card used as og:image when a document has no cover (see
 *  useArticleSeo). 1200×630, flat editorial layout (logo + rubric, title,
 *  ember tick + date/meta), bilingual via ?l=ru|en. Cached 1h. */

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
  base: '#10151C', ink: '#E8EAEE', faint: '#5B6573', ember: '#D69A6A',
  frame: 'rgba(255,255,255,0.09)', mark: 'rgba(255,255,255,0.24)',
}

// Schematic editorial frame — a hairline inset border with crop-tick brackets at
// the corners (same registration-mark language as the FPO placeholders). Content
// lives inside it with ~30px breathing room.
const INSET = 48       // stage edge → frame
const PAD   = '30px 40px' // frame → content
const MARK_LEN = 22, MARK_INSET = 30
const corner = (v: 'top' | 'bottom', hd: 'left' | 'right') => {
  const pos = { ...(v === 'top' ? { top: `${MARK_INSET}px` } : { bottom: `${MARK_INSET}px` }),
                ...(hd === 'left' ? { left: `${MARK_INSET}px` } : { right: `${MARK_INSET}px` }) }
  return [
    h('div', { style: { display: 'flex', position: 'absolute', ...pos, width: `${MARK_LEN}px`, height: '1px', backgroundColor: C.mark } }),
    h('div', { style: { display: 'flex', position: 'absolute', ...pos, width: '1px', height: `${MARK_LEN}px`, backgroundColor: C.mark } }),
  ]
}
const cornerMarks = () => [corner('top', 'left'), corner('top', 'right'), corner('bottom', 'left'), corner('bottom', 'right')].flat()

// wordmark logo (transparent PNG). aspect ≈ 1056:423 (2.4965:1)
const LOGO_AR = 1056 / 423
const logoSrc = `data:image/png;base64,${logoPng}`
const logo = (w: number) => {
  const height = Math.round(w / LOGO_AR)
  return h('img', { src: logoSrc, width: w, height, style: { display: 'flex', width: `${w}px`, height: `${height}px` } })
}

// flat monotone-dark stage + inset frame + corner crop-marks
const stage = (children: any[]) =>
  h('div', {
    style: {
      display: 'flex', position: 'relative', width: '1200px', height: '630px',
      padding: `${INSET}px`, backgroundColor: C.base,
    },
  },
    h('div', {
      style: {
        display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'space-between',
        border: `1px solid ${C.frame}`, borderRadius: '12px', padding: PAD,
      },
    }, children),
    cornerMarks(),
  )

const rubric = (eyebrow: string) =>
  h('div', { style: { display: 'flex', fontFamily: 'JetBrains Mono', fontSize: '22px', color: C.faint, letterSpacing: '4px' } }, eyebrow)

function template({ title, eyebrow, meta }: { title: string; eyebrow: string; meta: string }) {
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
