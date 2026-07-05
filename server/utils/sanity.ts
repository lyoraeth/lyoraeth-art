import { createClient } from '@sanity/client'

/** Sanity client for reads — CDN-cached, pinned API version. For authenticated
 *  writes / fresh reads, chain `.withConfig({ token, useCdn: false })`. */
export function createSanityClient(projectId: string, dataset: string) {
  return createClient({
    projectId,
    dataset,
    useCdn:     true,
    apiVersion: '2024-01-01',
  })
}
