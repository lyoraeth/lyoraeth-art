import type { WorkItem } from '../work.get'

/** A case page adds the full body and its neighbours (by the listing's own
 *  manual order) on top of the list fields. */
export type WorkDetail = WorkItem & {
  body: { en: string; ru: string } | null
  prev: AdjacentWork | null
  next: AdjacentWork | null
}

export interface AdjacentWork {
  slug:  string
  title: { en: string; ru: string }
}

/** GET /api/work/:slug — one work item, matched by slug or raw `_id`.
 *  404 when not found; null when the CMS is unconfigured. */
export default defineEventHandler(async event => {
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

  // prev/next walk the same manual order as the listing page — a plain
  // "sibling in publish order" query doesn't apply here, the order is
  // curated (order asc, _createdAt desc), so the neighbours come from
  // that same sequence rather than a comparison on a single field.
  const ordered = await client.fetch<AdjacentWork[]>(`
    *[_type == "work"] | order(order asc, _createdAt desc) {
      "slug": coalesce(slug.current, _id),
      title
    }
  `)
  const index = ordered.findIndex(w => w.slug === result.slug)
  result.prev = (index > 0 ? ordered[index - 1] : null) ?? null
  result.next = (index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null) ?? null

  return result
})
