import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'smml2m66',
    dataset:   process.env.SANITY_STUDIO_DATASET    ?? 'production',
  },
  // Pinned so `sanity deploy` runs non-interactively (deploys to lyoraeth.sanity.studio)
  studioHost: 'lyoraeth',
  deployment: {
    appId: 'qga6fhmn0qh11bxn75djjjxr',
  },
  server: {
    hostname: process.env.STUDIO_HOST ?? 'localhost',
    port:     parseInt(process.env.STUDIO_PORT ?? '3333'),
  },
})
