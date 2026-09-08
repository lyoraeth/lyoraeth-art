import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { OG_FONTS, ogCard } from '../../utils/ogTemplate'

/** Satori/resvg OG card for the homepage — og:image for `/` in app.vue.
 *  Unlike the post/case cards there's no CMS fetch and nothing that varies
 *  by locale (the RU name/role card is shared by both, same as the static
 *  og-image.png this replaced), so the render is cheap enough to skip
 *  caching entirely. */
export default defineEventHandler(async (event) => {
  const card = ogCard({
    title:   ['Данил', 'Климов'],
    caption: ['Фронтенд-разработчик.', 'Vue, TypeScript, Nuxt, GSAP.'],
    link:    'Lyoraeth.art',
  })

  const svg = await satori(card, { width: 1200, height: 630, fonts: OG_FONTS })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  setHeader(event, 'content-type', 'image/png')
  return Buffer.from(png)
})
