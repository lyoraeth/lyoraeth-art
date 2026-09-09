import { createHmac } from 'node:crypto'
import { Resend } from 'resend'

interface CommentBody {
  token:    string
  nick:     string
  message:  string
  postSlug: string
}

/** POST /api/comment — submit a post comment. Verifies Turnstile, stores the
 *  comment unapproved in Sanity, then emails an HMAC-signed one-click approve
 *  link (see /api/comment/approve). The email send is best-effort. */
export default defineEventHandler(async event => {
  const { token, nick, message, postSlug } = await readBody<CommentBody>(event)

  if (!nick?.trim() || !message?.trim() || !postSlug) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  // Same reasoning as /api/contact and /api/mcp/send: nothing legitimate
  // needs more, and an unbounded body is a free way to fill Sanity and the
  // notification mailbox both — this endpoint had no cap at all before.
  if (nick.length > 50 || message.length > 3000) {
    throw createError({ statusCode: 413, message: 'Comment too long' })
  }

  // ── Verify Turnstile ───────────────────────────────────────────────────────
  const valid = await verifyTurnstileToken(token, event)
  if (!valid.success) throw createError({ statusCode: 400, message: 'Captcha failed — please try again' })

  // ── Store in Sanity ────────────────────────────────────────────────────────
  const config = useRuntimeConfig(event)
  if (!config.sanityProjectId) throw createError({ statusCode: 503, message: 'CMS not configured' })

  const client = createSanityClient(config.sanityProjectId, config.sanityDataset)
    .withConfig({ token: config.sanityToken, useCdn: false })

  const doc = await client.create({
    _type:       'comment',
    postSlug,
    nick:        nick.replace(/^@+/, '').trim(),
    message:     message.trim(),
    publishedAt: new Date().toISOString(),
    approved:    false,
  })

  // ── Send approve email ─────────────────────────────────────────────────────
  if (config.resendApiKey && config.mailerTo && config.sanityToken) {
    const approveToken = createHmac('sha256', config.sanityToken).update(doc._id).digest('hex')
    const approveUrl   = `https://lyoraeth.art/api/comment/approve?id=${doc._id}&token=${approveToken}`
    const resend = new Resend(config.resendApiKey)
    await resend.emails.send({
      from:    config.mailerFrom || 'lyoraeth.art <hello@lyoraeth.art>',
      to:      config.mailerTo,
      subject: `New comment on /${postSlug}`,
      html: `
        <p><strong>@${escapeHtml(nick.replace(/^@+/, '').trim())}</strong> on <code>${escapeHtml(postSlug)}</code>:</p>
        <blockquote style="border-left:3px solid #ccc;margin:0;padding:0.5em 1em;color:#555">
          ${escapeHtml(message.trim()).replace(/\n/g, '<br>')}
        </blockquote>
        <p style="margin-top:1.5em">
          <a href="${approveUrl}" style="background:#d69a6a;color:#fff;padding:0.5em 1.25em;text-decoration:none;border-radius:4px">
            Approve comment
          </a>
        </p>
      `,
    }).catch(() => {})
  }

  return { ok: true }
})
