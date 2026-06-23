import { createHash } from 'node:crypto'

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
    const status = e?.statusCode ?? e?.response?.statusCode
    if (status === 409) throw createError({ statusCode: 409, message: 'Already voted' })
    throw e
  }

  const updated = await client.fetch<{ up: number; down: number }>(
    `*[_id == $id][0] { up, down }`,
    { id: ratingId },
  )
  return updated ?? { up: 0, down: 0 }
})
