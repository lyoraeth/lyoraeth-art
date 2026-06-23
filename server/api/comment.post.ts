interface CommentBody {
  token:    string   // Turnstile token
  name:     string
  email:    string
  message:  string
  postSlug: string
}

export default defineEventHandler(async (event) => {
  const { token, name, email, message, postSlug } = await readBody<CommentBody>(event)

  if (!name?.trim() || !email?.trim() || !message?.trim() || !postSlug) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  // ── Verify Turnstile ───────────────────────────────────────────────────────
  const valid = await verifyTurnstileToken(token)
  if (!valid) throw createError({ statusCode: 400, message: 'Captcha failed — please try again' })

  // ── Store in Sanity ────────────────────────────────────────────────────────
  const config = useRuntimeConfig(event)
  if (!config.sanityProjectId) throw createError({ statusCode: 503, message: 'CMS not configured' })

  const client = createSanityClient(config.sanityProjectId, config.sanityDataset)
    .withConfig({ token: config.sanityToken, useCdn: false })

  await client.create({
    _type:       'comment',
    postSlug,
    name:        name.trim(),
    email:       email.trim().toLowerCase(),
    message:     message.trim(),
    publishedAt: new Date().toISOString(),
    approved:    true,
  })

  return { ok: true }
})
