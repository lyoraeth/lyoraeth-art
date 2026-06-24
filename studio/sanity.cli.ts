import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'smml2m66',
    dataset:   process.env.SANITY_STUDIO_DATASET    ?? 'production',
  },
  server: {
    hostname: process.env.STUDIO_HOST ?? 'localhost',
    port:     parseInt(process.env.STUDIO_PORT ?? '3333'),
  },
})
