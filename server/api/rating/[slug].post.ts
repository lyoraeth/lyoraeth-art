import { createHash } from 'node:crypto'

/** POST /api/rating/:slug — record one up/down vote. Dedupes per voter with a
 *  salted SHA-256 of IP+slug as the vote doc id, so a repeat vote hits Sanity's
 *  create conflict and returns 409 (Already voted). 400 on a bad `dir` body. */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { dir } = await readBody<{ dir: 'up' | 'down' }>(event)
  if (dir !== 'up' && dir !== 'down') throw createError({ statusCode: 400 })

  const { sanityProjectId, sanityDataset, sanityToken } = useRuntimeConfig(event)
  if (!sanityProjectId) throw createError({ statusCode: 503, message: 'CMS not configured' })

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const ipHash = createHash('sha256').update(ip + slug).digest('hex').slice(0, 24)

  const voteId   = `vote.${slug}.${ipHash}`
  const ratingId = `rating.${slug}`

  const client = createSanityClient(sanityProjectId, sanityDataset)
    .withConfig({ token: sanityToken, useCdn: false })

  try {
    await client
      .transaction()
      .create({ _id: voteId, _type: 'ratingVote', slug, ipHash, dir })
      .createIfNotExists({ _id: ratingId, _type: 'rating', slug, up: 0, down: 0 })
      .patch(ratingId, { inc: { [dir]: 1 } })
      .commit()
  } catch (e: any) {
    const status = e?.statusCode ?? e?.response?.statusCode ?? e?.status
    if (status === 409) throw createError({ statusCode: 409, message: 'Already voted' })
    throw e
  }

  return { ok: true }
})
