import { Resend } from 'resend'

interface ContactBody {
  token:   string
  contact: string
  message: string
}

/** POST /api/contact — public contact form. Verifies a Cloudflare Turnstile
 *  token before emailing via Resend. 400 on empty fields or captcha failure,
 *  503 when the mailer is unconfigured. */
export default defineEventHandler(async event => {
  const { token, contact, message } = await readBody<ContactBody>(event)

  if (!contact?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  // same caps as the WebMCP endpoint: nothing here needs more, and an
  // unbounded body is a free way to fill a mailbox
  if (contact.length > 200 || message.length > 5000) {
    throw createError({ statusCode: 413, message: 'Message too long' })
  }

  const { resendApiKey, mailerFrom, mailerTo } = useRuntimeConfig(event)
  const valid = await verifyTurnstileToken(token, event)
  if (!valid.success) throw createError({ statusCode: 400, message: 'Captcha failed — please try again' })

  if (!resendApiKey || !mailerTo) {
    throw createError({ statusCode: 503, message: 'Mailer not configured' })
  }

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from:    mailerFrom || 'lyoraeth.art <hello@lyoraeth.art>',
    to:      mailerTo,
    subject: 'New message — lyoraeth.art',
    text:    `From: ${contact.trim()}\n\n${message.trim()}`,
    // escaped: the body is attacker-controlled text landing in an HTML email
    html:    `<p><strong>From:</strong> ${escapeHtml(contact.trim())}</p><pre style="font-family:inherit">${escapeHtml(message.trim())}</pre>`,
  })

  return { ok: true }
})
