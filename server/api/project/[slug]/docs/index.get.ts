/** GET /api/project/:slug/docs — the docs nav and every page's headings, both
 *  locales. 404 when the project has no docs; 502 when GitHub can't be
 *  reached and there is nothing cached to serve instead. */
export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  const { owner, repo, ref, docsPath } = await resolveDocsSource(slug)
  return docsGuard(`${owner}/${repo}/index`, () => loadDocsIndex(owner, repo, ref, docsPath))
})
