import { Resend } from 'resend'

interface McpContactBody {
  contact: string
  message: string
}

export default defineEventHandler(async (event) => {
  const { contact, message } = await readBody<McpContactBody>(event)

  if (!contact?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
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
    html:    `<p><strong>From (WebMCP):</strong> ${contact.trim()}</p><pre style="font-family:inherit">${message.trim()}</pre>`,
  })

  return { ok: true }
})
