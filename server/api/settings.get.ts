export interface SiteSettings {
  telegramHandle:  string
  githubHandle:    string
  cvUrlEn:         string | null
  cvUrlRu:         string | null
  notice:          { enabled: boolean; text: { en: string; ru: string } | null } | null
}

const DEFAULTS: SiteSettings = {
  telegramHandle:  'lyoraeth',
  githubHandle:    'lyoraeth',
  cvUrlEn:         null,
  cvUrlRu:         null,
  notice:          null,
}

/** GET /api/settings — site-wide settings singleton (social handles, CV asset
 *  URLs). Falls back to DEFAULTS when unset or CMS unconfigured. */
export default defineEventHandler(async event => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return DEFAULTS

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const doc = await client.fetch<SiteSettings | null>(`
    *[_type == "siteSettings"][0] {
      telegramHandle,
      githubHandle,
      "cvUrlEn": cvEn.asset->url,
      "cvUrlRu": cvRu.asset->url,
      notice { enabled, text }
    }
  `)

  return doc ?? DEFAULTS
})
