/** Shared OG/Twitter meta for the two article-shaped pages (writing + work).
 *  Sets `useSeoMeta` and returns `ogImage` / `pageUrl` so each page can reuse
 *  them inside its own JSON-LD (which stays page-specific). */
export function useArticleSeo(opts: {
  type:        'writing' | 'work'
  title:       () => string
  description: () => string
  coverUrl:    () => string | null | undefined
  coverWidth:  () => number | null | undefined
  coverHeight: () => number | null | undefined
  coverAlt:    () => string | null | undefined
}) {
  const route = useRoute()
  const { locale } = useI18n()
  const slug = route.params.slug as string

  /* Cover, if present, gets a bounded jpeg. With no cover we fall back to a
     branded 1200×630 image generated on the fly (server/routes/og), localized
     via ?l — so link previews are always on-brand, never the bare og-image.png. */
  const generated = computed(() => !opts.coverUrl())
  const ogImage = computed(() =>
    opts.coverUrl()
      ? sanityFmt(opts.coverUrl()!, 'jpg', { w: 1200, q: 80 })
      : `https://lyoraeth.art/og/${opts.type}/${encodeURIComponent(slug)}?l=${locale.value}`,
  )
  const ogImageHeight = computed(() => {
    if (generated.value) return 630
    if (opts.coverWidth() && opts.coverHeight()) return Math.round(1200 * opts.coverHeight()! / opts.coverWidth()!)
    return undefined
  })
  const ogImageAlt = computed(() => opts.coverAlt() ?? opts.title())
  const pageUrl    = computed(() => `https://lyoraeth.art${route.path}`)

  useSeoMeta({
    title:              computed(() => `${opts.title()} — lyoraeth`),
    description:        () => opts.description(),
    ogTitle:            () => opts.title(),
    ogDescription:      () => opts.description(),
    ogImage:            ogImage,
    ogImageWidth:       computed(() => ogImageHeight.value ? 1200 : undefined),
    ogImageHeight:      ogImageHeight,
    ogImageAlt:         ogImageAlt,
    ogType:             'article',
    ogUrl:              pageUrl,
    twitterCard:        'summary_large_image',
    twitterImage:       ogImage,
    twitterDescription: () => opts.description(),
  })

  return { ogImage, pageUrl }
}
