import { Resend } from 'resend'

interface McpContactBody {
  contact: string
  message: string
}

/** POST /api/mcp/send — contact endpoint for the WebMCP `send_message` tool.
 *  No captcha (the browser-agent bridge can't solve one); emails via Resend.
 *  400 on empty fields, 413 on oversized input, 503 when the mailer is
 *  unconfigured. Rate-limited at the nginx layer alongside /api/contact. */
export default defineEventHandler(async (event) => {
  const { contact, message } = await readBody<McpContactBody>(event)

  if (!contact?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  // Bound the payload — this endpoint has no captcha, so cap abuse surface.
  if (contact.length > 200 || message.length > 5000) {
    throw createError({ statusCode: 413, message: 'Message too long' })
  }

  const { resendApiKey, mailerFrom, mailerTo } = useRuntimeConfig(event)

  if (!resendApiKey || !mailerTo) {
    throw createError({ statusCode: 503, message: 'Mailer not configured' })
  }

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from:    mailerFrom || 'lyoraeth.art <hello@lyoraeth.art>',
    to:      mailerTo,
    subject: 'New message via WebMCP — lyoraeth.art',
    text:    `From: ${contact.trim()}\n\n${message.trim()}`,
    html:    `<p><strong>From (WebMCP):</strong> ${escapeHtml(contact.trim())}</p><pre style="font-family:inherit">${escapeHtml(message.trim())}</pre>`,
  })

  return { ok: true }
})
