// One-off cleanup of data the schema no longer defines.
//
//   node migrate-orphans.mjs          # dry run — reports, changes nothing
//   node migrate-orphans.mjs --apply  # actually mutates the dataset
//
// Requires studio/.env with SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET
// and SANITY_TOKEN (write access).
//
// Removes:
//   - siteSettings.heroPortrait  — the hero is static files now (see the
//     content-model rebuild); the field is gone from the schema, the value
//     lingers in the doc and pins an image asset
//   - siteStatus documents       — the availability-status feature is gone,
//     the type has no schema

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

try {
  const env = readFileSync(resolve(__dir, '.env'), 'utf8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    // don't clobber a var already set in the environment — lets the caller
    // override a stale .env token with `SANITY_TOKEN=… node migrate-orphans.mjs`
    if (k && v.length && !(k.trim() in process.env)) process.env[k.trim()] = v.join('=').trim()
  }
} catch {}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset   = process.env.SANITY_STUDIO_DATASET ?? 'production'
const apply     = process.argv.includes('--apply')

if (!projectId || !process.env.SANITY_TOKEN) {
  console.error('SANITY_STUDIO_PROJECT_ID and SANITY_TOKEN must be set in studio/.env')
  process.exit(1)
}

const client = createClient({ projectId, dataset, useCdn: false, apiVersion: '2024-01-01', token: process.env.SANITY_TOKEN })

console.log(`dataset: ${dataset}   mode: ${apply ? 'APPLY' : 'dry run'}\n`)

// ── siteSettings.heroPortrait ────────────────────────────────────────────────
const settings = await client.fetch('*[_type == "siteSettings"][0]{ _id, "assetRef": heroPortrait.asset._ref }')
if (settings?.assetRef) {
  console.log(`siteSettings (${settings._id}): unset heroPortrait  (asset ${settings.assetRef})`)
  if (apply) {
    await client.patch(settings._id).unset(['heroPortrait']).commit()
    try {
      await client.delete(settings.assetRef)
      console.log('  asset deleted')
    }
    catch (e) {
      console.log(`  asset kept — ${e.message.split('\n')[0]} (still referenced, or protected)`)
    }
  }
}
else {
  console.log('siteSettings.heroPortrait: already clean')
}

// ── siteStatus documents ────────────────────────────────────────────────────
const statusIds = await client.fetch('*[_type == "siteStatus"]._id')
if (statusIds.length) {
  console.log(`siteStatus: delete ${statusIds.length} document(s) — ${statusIds.join(', ')}`)
  if (apply) {
    await client.delete({ query: '*[_type == "siteStatus"]' })
    console.log('  deleted')
  }
}
else {
  console.log('siteStatus: none')
}

console.log(apply ? '\ndone' : '\ndry run — re-run with --apply to mutate')
