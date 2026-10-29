import type { ProjectItem } from '../project.get'
import type { GalleryImage } from '../post/[slug].get'

/** A landing page adds the overview, its screenshots and the neighbours (by
 *  the listing's own manual order) on top of the list fields. */
export type ProjectDetail = ProjectItem & {
  body:     { en: string | null; ru: string | null } | null
  gallery:  GalleryImage[] | null
  docsPath: string | null
  prev:     AdjacentProject | null
  next:     AdjacentProject | null
}

export interface AdjacentProject {
  slug:  string
  title: { en: string; ru: string }
}

/** GET /api/project/:slug — one project, matched by slug or raw `_id`.
 *  404 when not found; null when the CMS is unconfigured. */
export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  const { sanityProjectId, sanityDataset } = useRuntimeConfig(event)
  if (!sanityProjectId) return null

  const client = createSanityClient(sanityProjectId, sanityDataset)

  const result = await client.fetch<ProjectDetail | null>(`
    *[_type == "project" && (slug.current == $slug || _id == $slug)][0] {
      _id,
      "slug": coalesce(slug.current, _id),
      title,
      teaser,
      excerpt,
      body,
      tags,
      status,
      year,
      repoUrl,
      demoUrl,
      "hasDocs":  coalesce(hasDocs, false),
      "docsPath": select(hasDocs == true => coalesce(docsPath, "docs")),
      "logoUrl":     logo.asset->url,
      "coverUrl":    cover.asset->url,
      "coverAlt":    cover.alt,
      "coverWidth":  cover.asset->metadata.dimensions.width,
      "coverHeight": cover.asset->metadata.dimensions.height,
      "gallery": gallery[]{
        key, alt,
        "url":    image.asset->url,
        "width":  image.asset->metadata.dimensions.width,
        "height": image.asset->metadata.dimensions.height
      }
    }
  `, { slug })

  if (!result) throw createError({ statusCode: 404, message: 'Project not found' })

  // prev/next walk the same manual order as the listing — the order is
  // curated (order asc, _createdAt desc), so neighbours come from that same
  // sequence rather than a comparison on a single field.
  const ordered = await client.fetch<AdjacentProject[]>(`
    *[_type == "project"] | order(order asc, _createdAt desc) {
      "slug": coalesce(slug.current, _id),
      title
    }
  `)
  const index = ordered.findIndex(p => p.slug === result.slug)
  result.prev = (index > 0 ? ordered[index - 1] : null) ?? null
  result.next = (index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null) ?? null

  return result
})
