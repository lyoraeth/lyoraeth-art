import type { WorkItem } from '../work.get'

/** A case page adds the full body on top of the list fields. */
export type WorkDetail = WorkItem & { body: { en: string; ru: string } | null }

/** GET /api/work/:slug — one work item, matched by slug or raw `_id`.
 *  404 when not found; null when the CMS is unconfigured. */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return null

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const result = await client.fetch<WorkDetail | null>(`
    *[_type == "work" && (slug.current == $slug || _id == $slug)][0] {
      _id,
      "slug": coalesce(slug.current, _id),
      title,
      teaser,
      excerpt,
      body,
      tags,
      url,
      showLink,
      year,
      "coverUrl":    cover.asset->url,
      "coverAlt":    cover.alt,
      "coverWidth":  cover.asset->metadata.dimensions.width,
      "coverHeight": cover.asset->metadata.dimensions.height
    }
  `, { slug })

  if (!result) throw createError({ statusCode: 404, message: 'Work item not found' })
  return result
})
