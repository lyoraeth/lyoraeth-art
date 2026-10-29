/** GET /api/project/:slug/docs/:page — one docs page's markdown (both
 *  locales), by the flat key from the docs index. 404 for an unknown key, the
 *  README (that's the landing page), or a project without docs. */
export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  const page = getRouterParam(event, 'page')!
  const { owner, repo, ref, docsPath } = await resolveDocsSource(slug)
  return docsGuard(`${owner}/${repo}/${page}`, () => loadDocsPage(owner, repo, ref, docsPath, page))
})
