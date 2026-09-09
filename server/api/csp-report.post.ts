import { Resend } from 'resend'

/** POST /api/csp-report — browser CSP violation sink (report-uri target).
 *  Parses the report envelope and emails a digest via Resend (best-effort).
 *  Always answers 204, even on malformed/empty bodies. */
export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)

  const raw = await readRawBody(event)
  if (!raw) return sendNoContent(event)

  let report: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    report = parsed['csp-report'] ?? parsed
  }
  catch {
    return sendNoContent(event)
  }

  if (config.resendApiKey && config.mailerTo) {
    const directive = String(report['violated-directive'] ?? report['effective-directive'] ?? '—')
    const blocked   = String(report['blocked-uri'] ?? '—')
    const page      = String(report['document-uri'] ?? '—')

    const resend = new Resend(config.resendApiKey)
    await resend.emails.send({
      from:    config.mailerFrom || 'lyoraeth.art <hello@lyoraeth.art>',
      to:      config.mailerTo,
      subject: `CSP violation: ${directive}`,
      html: `
        <p><strong>Directive:</strong> ${escapeHtml(directive)}</p>
        <p><strong>Blocked:</strong> ${escapeHtml(blocked)}</p>
        <p><strong>Page:</strong> ${escapeHtml(page)}</p>
        <details><summary>Full report</summary>
          <pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>
        </details>
      `,
    }).catch(() => {})
  }

  return sendNoContent(event)
})
