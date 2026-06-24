import { Resend } from 'resend'

interface ContactBody {
  token:   string
  contact: string
  message: string
}

export default defineEventHandler(async (event) => {
  const { token, contact, message } = await readBody<ContactBody>(event)

  if (!contact?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, message: 'All fields are required' })
  }

  const { turnstileContactSecretKey, resendApiKey, mailerFrom, mailerTo } = useRuntimeConfig(event)
  const valid = await verifyTurnstileToken(token, event)
  if (!valid) throw createError({ statusCode: 400, message: 'Captcha failed — please try again' })

  if (!resendApiKey || !mailerTo) {
    throw createError({ statusCode: 503, message: 'Mailer not configured' })
  }

  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from:    mailerFrom || 'lyoraeth.art <hello@lyoraeth.art>',
    to:      mailerTo,
    subject: 'New message — lyoraeth.art',
    text:    `From: ${contact.trim()}\n\n${message.trim()}`,
    html:    `<p><strong>From:</strong> ${contact.trim()}</p><pre style="font-family:inherit">${message.trim()}</pre>`,
  })

  return { ok: true }
})
