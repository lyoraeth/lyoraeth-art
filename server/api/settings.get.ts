export interface SiteSettings {
  telegramHandle:  string
  githubHandle:    string
  cvUrlEn:         string | null
  cvUrlRu:         string | null
  heroPortraitUrl: string | null
}

const DEFAULTS: SiteSettings = {
  telegramHandle:  'lyoraeth',
  githubHandle:    'lyoraeth',
  cvUrlEn:         null,
  cvUrlRu:         null,
  heroPortraitUrl: null,
}

export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return DEFAULTS

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const doc = await client.fetch<SiteSettings | null>(`
    *[_type == "siteSettings"][0] {
      telegramHandle,
      githubHandle,
      "cvUrlEn": cvEn.asset->url,
      "cvUrlRu": cvRu.asset->url,
      "heroPortraitUrl": heroPortrait.asset->url
    }
  `)

  return doc ?? DEFAULTS
})
