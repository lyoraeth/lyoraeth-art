export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { sanityProjectId, sanityDataset, sanityToken } = useRuntimeConfig(event)
  if (!sanityProjectId) return { up: 0, down: 0 }

  const client = createSanityClient(sanityProjectId, sanityDataset)
    .withConfig({ token: sanityToken, useCdn: false })
  const doc = await client.fetch<{ up: number; down: number } | null>(
    `*[_id == $id][0] { up, down }`,
    { id: `rating.${slug}` },
  )
  return doc ?? { up: 0, down: 0 }
})
