import { createClient } from '@sanity/client'

export function createSanityClient(projectId: string, dataset: string) {
  return createClient({
    projectId,
    dataset,
    useCdn:     true,
    apiVersion: '2024-01-01',
  })
}
