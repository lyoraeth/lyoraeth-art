export default defineNuxtPlugin(() => {
  if (!('modelContext' in navigator)) return

  const ctx = (navigator as Navigator & { modelContext: any }).modelContext

  ctx.registerTool({
    name: 'send_message',
    description: 'Send a message to Danil Klimov via the contact form. Use this to reach out about a project, collaboration, or question.',
    inputSchema: {
      type: 'object',
      properties: {
        contact: {
          type: 'string',
          description: 'Your name, Telegram handle (@username), or email address so Danil can reply.',
        },
        message: {
          type: 'string',
          description: 'The message text. Briefly describe what you need.',
        },
      },
      required: ['contact', 'message'],
    },
    execute: async ({ contact, message }: { contact: string; message: string }) => {
      const res = await fetch('/api/mcp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, message }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Failed to send message')
      }

      return { success: true, message: 'Message sent to Danil. He will reply via the contact method you provided.' }
    },
  })
})
