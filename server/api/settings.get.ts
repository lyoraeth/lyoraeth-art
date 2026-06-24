export interface SiteSettings {
  telegramHandle: string
  githubHandle:   string
  cvUrl:          string | null
}

const DEFAULTS: SiteSettings = {
  telegramHandle: 'lyoraeth',
  githubHandle:   'lyoraeth',
  cvUrl:          null,
}

export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return DEFAULTS

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const doc = await client.fetch<SiteSettings | null>(`
    *[_type == "siteSettings"][0] {
      telegramHandle,
      githubHandle,
      "cvUrl": cv.asset->url
    }
  `)

  return doc ?? DEFAULTS
})
