import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  server: {
    hostname: process.env.STUDIO_HOST ?? 'localhost',
    port:     parseInt(process.env.STUDIO_PORT ?? '3333'),
  },
})
