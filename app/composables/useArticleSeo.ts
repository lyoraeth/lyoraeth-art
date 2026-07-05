/** Shared OG/Twitter meta for the two article-shaped pages (writing + work).
 *  Sets `useSeoMeta` and returns `ogImage` / `pageUrl` so each page can reuse
 *  them inside its own JSON-LD (which stays page-specific). */
export function useArticleSeo(opts: {
  title:       () => string
  description: () => string
  coverUrl:    () => string | null | undefined
  coverWidth:  () => number | null | undefined
  coverHeight: () => number | null | undefined
  coverAlt:    () => string | null | undefined
}) {
  const route = useRoute()

  /* social crawlers get a bounded jpeg, not the multi-megabyte original;
     the static fallback ships as-is — transform params would 404 on it */
  const ogImage = computed(() =>
    opts.coverUrl() ? sanityFmt(opts.coverUrl()!, 'jpg', { w: 1200, q: 80 }) : 'https://lyoraeth.art/og-image.png'
  )
  const ogImageHeight = computed(() =>
    opts.coverUrl() && opts.coverWidth() && opts.coverHeight()
      ? Math.round(1200 * opts.coverHeight()! / opts.coverWidth()!)
      : undefined
  )
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
