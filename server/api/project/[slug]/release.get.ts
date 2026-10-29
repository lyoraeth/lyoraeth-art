/** GET /api/project/:slug/release — the repo's latest release, or null.
 *  Never an error for the visitor: the version is a nicety of the docs header,
 *  so a GitHub hiccup (or no release yet) just leaves it out.
 *
 *  The answer is cached as a whole, a failure included: when GitHub refuses
 *  (a rate limit, an outage) and nothing is cached to serve, retrying on every
 *  docs page view would only dig the hole deeper. A miss costs ten minutes. */
export default defineCachedEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')!
  const { owner, repo } = await resolveDocsSource(slug)
  try {
    return await loadLatestRelease(owner, repo)
  }
  catch (error) {
    console.error('[docs]', error instanceof Error ? error.message : error)
    return null
  }
}, { maxAge: 60 * 10, name: 'project-release', getKey: event => getRouterParam(event, 'slug') ?? '' })
