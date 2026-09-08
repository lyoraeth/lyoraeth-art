import { ppPangramSansSemibold } from './ogFontsLight'
import { logoLightPng } from './ogLogoLight'
import { ogDecorPng } from './ogDecor'

/**
 * Shared satori template for the light-theme OG cards — used by the dynamic
 * `/og/[type]/[slug]` route (post/case cards) and by the one-off script that
 * bakes the static homepage card (`scripts/generate-og-home.mjs`).
 *
 * One font (PP Pangram Sans Semibold, the only weight the cards use) covers
 * both scripts — no separate Latin/Cyrillic subsets needed here, unlike the
 * old dark template's Onest setup.
 */
export const OG_FONTS = [
  { name: 'PP Pangram Sans', data: Buffer.from(ppPangramSansSemibold, 'base64'), weight: 600 as const, style: 'normal' as const },
]

const C = { bg: '#FAFAFA', ink: '#1F2123', muted: '#5B636B', ember: '#C94C17' }

// tiny hyperscript for satori's vnode shape
const h = (type: string, props: any, ...kids: any[]): any => ({
  type,
  props: { ...props, children: kids.flat().filter(k => k != null) },
})

const logoSrc  = `data:image/png;base64,${logoLightPng}`
const decorSrc = `data:image/png;base64,${ogDecorPng}`

// wordmark + dot already baked into one image (aspect ≈ 480:85)
const LOGO_AR = 480 / 85
const logo = (height: number) => h('img', {
  src: logoSrc, width: Math.round(height * LOGO_AR), height,
  style: { display: 'flex' },
})

export interface OgCardOptions {
  /** A single string wraps and clamps (post/case titles); an array of exact
   *  lines skips wrapping entirely (only the fixed two-line homepage name
   *  needs that — everything else is real, variable-length content). */
  title:   string | string[]
  /** Below the title — post topic, case teaser, or the homepage role/stack
   *  pair. Omit for a title-only card. */
  caption?: string[]
  /** Bottom-left brand line — the card always ends on it. */
  link:    string
}

export function ogCard({ title, caption = [], link }: OgCardOptions) {
  const hero = Array.isArray(title)
  const titleStyle = hero
    ? { fontSize: '88px', lineHeight: '96.8px', letterSpacing: '1.76px' }
    : { fontSize: '52px', lineHeight: '57.2px', letterSpacing: '1.04px', maxWidth: '454px', lineClamp: 3 }

  const titleNode = hero
    ? h('div', { style: { display: 'flex', flexDirection: 'column' } },
        ...(title as string[]).map(line => h('div', { style: { display: 'flex' } }, line)))
    : h('div', { style: { display: 'flex' } }, title as string)

  return h('div', {
    style: {
      display: 'flex', position: 'relative', width: '1200px', height: '630px',
      backgroundColor: C.bg, overflow: 'hidden',
    },
  },
    // faint right-side wordmark fragment — decorative, sits behind the text
    h('img', {
      src: decorSrc, width: 682, height: 630,
      style: { display: 'flex', position: 'absolute', left: '518px', top: '0px' },
    }),

    h('div', {
      style: {
        display: 'flex', flexDirection: 'column', position: 'relative',
        paddingTop: '64px', paddingLeft: '64px',
      },
    },
      logo(28),

      h('div', { style: { display: 'flex', marginTop: '40px', width: '48px', height: '4px', borderRadius: '2px', backgroundColor: C.ember } }),

      h('div', {
        style: {
          display: 'flex', marginTop: '24px', color: C.ink,
          fontFamily: 'PP Pangram Sans', fontWeight: 600, wordBreak: 'break-word',
          ...titleStyle,
        },
      }, titleNode),

      ...caption.map((line, i) =>
        h('div', {
          style: {
            display: 'flex', marginTop: i === 0 ? '32px' : '8px', maxWidth: '454px',
            color: C.muted, fontFamily: 'PP Pangram Sans', fontWeight: 600,
            fontSize: '20px', lineHeight: '25px', letterSpacing: '0.4px',
          },
        }, line),
      ),

      h('div', {
        style: {
          display: 'flex', marginTop: caption.length ? '64px' : '96px',
          color: C.muted, fontFamily: 'PP Pangram Sans', fontWeight: 600,
          fontSize: '14px', lineHeight: '17.5px', letterSpacing: '0.28px',
        },
      }, link),
    ),
  )
}
