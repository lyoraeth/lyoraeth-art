import type { WorkItem } from '../work.get'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return null

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const result = await client.fetch<WorkItem | null>(`
    *[_type == "work" && (slug.current == $slug || _id == $slug)][0] {
      _id,
      "slug": coalesce(slug.current, _id),
      title,
      kicker,
      description,
      tags,
      tagWarm,
      url,
      year,
      "coverUrl": cover.asset->url
    }
  `, { slug })

  if (!result) throw createError({ statusCode: 404, message: 'Work item not found' })
  return result
})
