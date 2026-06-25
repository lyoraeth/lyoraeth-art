import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const { id, token } = getQuery(event) as { id?: string; token?: string }

  if (!id || !token) {
    throw createError({ statusCode: 400, message: 'Missing id or token' })
  }

  const config = useRuntimeConfig(event)
  if (!config.sanityProjectId || !config.sanityToken) {
    throw createError({ statusCode: 503, message: 'CMS not configured' })
  }

  const expected = createHmac('sha256', config.sanityToken).update(id).digest('hex')
  const tokBuf   = Buffer.from(token,    'hex')
  const expBuf   = Buffer.from(expected, 'hex')

  if (tokBuf.length !== expBuf.length || !timingSafeEqual(tokBuf, expBuf)) {
    throw createError({ statusCode: 403, message: 'Invalid token' })
  }

  const client = createSanityClient(config.sanityProjectId, config.sanityDataset)
    .withConfig({ token: config.sanityToken, useCdn: false })

  await client.patch(id).set({ approved: true }).commit()

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return `<!doctype html><html><head><meta charset="utf-8">
    <title>Comment approved</title>
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0c10;color:#e8e0d5}
    .box{text-align:center}.check{font-size:3rem;margin-bottom:1rem}</style>
  </head><body><div class="box"><div class="check">✓</div><p>Comment approved and published.</p></div></body></html>`
})
