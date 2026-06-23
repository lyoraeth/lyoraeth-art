import nodemailer from 'nodemailer'

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

  const { turnstileContactSecretKey, mailerHost, mailerPort, mailerUser, mailerPass, mailerTo } = useRuntimeConfig(event)
  const valid = await verifyTurnstileToken(token, turnstileContactSecretKey || undefined)
  if (!valid) throw createError({ statusCode: 400, message: 'Captcha failed — please try again' })

  if (!mailerHost || !mailerUser || !mailerPass || !mailerTo) {
    throw createError({ statusCode: 503, message: 'Mailer not configured' })
  }

  const transporter = nodemailer.createTransport({
    host:   mailerHost,
    port:   Number(mailerPort) || 587,
    secure: Number(mailerPort) === 465,
    auth: { user: mailerUser, pass: mailerPass },
  })

  await transporter.sendMail({
    from:    `"lyoraeth.art" <${mailerUser}>`,
    to:      mailerTo,
    subject: 'New message — lyoraeth.art',
    text:    `From: ${contact.trim()}\n\n${message.trim()}`,
    html:    `<p><strong>From:</strong> ${contact.trim()}</p><pre style="font-family:inherit">${message.trim()}</pre>`,
  })

  return { ok: true }
})
