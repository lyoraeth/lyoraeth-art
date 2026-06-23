export default defineEventHandler(async (event) => {
  const { sanityProjectId, sanityDataset, sanityToken } = useRuntimeConfig(event)
  if (!sanityProjectId) return { availability: 'available' }

  const client = createSanityClient(sanityProjectId, sanityDataset)
    .withConfig({ token: sanityToken, useCdn: false })

  const doc = await client.fetch<{ availability: string } | null>(
    `*[_type == "siteStatus"][0] { availability }`,
  )
  return { availability: doc?.availability ?? 'available' }
})
