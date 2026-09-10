import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import {
  MEDIA_FORMATS, effectiveWidths, mediaBasename, sanityAssetHash,
  type MediaFamily,
} from '#shared/media'

/**
 * Keeps `<mediaRoot>/` in sync with what published content references:
 * downloads each source once, encodes the delivery variants that are
 * missing, and prunes variants whose source is no longer referenced.
 *
 * Runs on a schedule inside the app container (see nuxt.config `nitro`),
 * not at deploy time — content and its images change far more often than
 * the app does. A run does bounded work (`mediaSyncBatch` new variants) so
 * a backlog of fresh covers spreads over several ticks instead of pinning
 * the CPU.
 */
export default defineTask({
  meta: {
    name: 'media:sync',
    description: 'Encode self-hosted image variants for referenced media',
  },
  async run() {
    const cfg = useRuntimeConfig()
    const root = cfg.mediaRoot
    const rawDir = join(root, '_raw')
    const budget = Number(cfg.mediaSyncBatch) || 12

    await mkdir(rawDir, { recursive: true })

    // ── Gather sources ──────────────────────────────────────────────────
    // Each source: a stable hash, a fetcher for its bytes, its pixel width,
    // and which families it needs. `full` for everything; `cover` (the 4:3
    // top crop) only for CMS covers, which the narrow layout shows cropped.
    type Source = {
      hash:      string
      width:     number
      families:  MediaFamily[]
      load:      () => Promise<string> // resolves to a local file path
    }
    const sources: Source[] = []
    const tmpFiles: string[] = []

    // CMS covers
    if (cfg.sanityProjectId) {
      const client = createSanityClient(cfg.sanityProjectId, cfg.sanityDataset)
      const rows = await client.fetch<{ url: string | null; width: number | null }[]>(`
        *[_type in ["work", "post"] && !(_id in path("drafts.**")) && defined(cover.asset)]{
          "url": cover.asset->url,
          "width": cover.asset->metadata.dimensions.width
        }
      `)
      const seen = new Set<string>()
      for (const { url, width } of rows) {
        const hash = sanityAssetHash(url)
        if (!hash || !url || !width || seen.has(hash)) continue
        seen.add(hash)
        sources.push({
          hash,
          width,
          families: ['cover', 'full'],
          load: async () => {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`)
            const file = join(tmpdir(), `media-src-${hash}.png`)
            await writeFile(file, Buffer.from(await res.arrayBuffer()))
            tmpFiles.push(file)
            return file
          },
        })
      }
    }

    // Hand-placed sources (the hero portrait etc.) — hashed by content so a
    // swapped file becomes new variants and the old ones get pruned.
    for (const name of await readdir(rawDir).catch(() => [] as string[])) {
      if (!/\.png$/i.test(name)) continue
      const path = join(rawDir, name)
      const bytes = await readFile(path)
      const meta = await probeSize(path)
      if (!meta) continue
      sources.push({
        hash:     createHash('sha1').update(bytes).digest('hex'),
        width:    meta.width,
        families: ['full'],
        load:     async () => path,
      })
    }

    // ── Encode what's missing, up to the batch budget ───────────────────
    const referenced = new Set(sources.map(s => s.hash))
    let encoded = 0
    let capped = false

    for (const src of sources) {
      if (capped) break
      let loaded: string | null = null

      for (const family of src.families) {
        for (const width of effectiveWidths(family, src.width)) {
          for (const format of MEDIA_FORMATS) {
            const out = join(root, mediaBasename(src.hash, family, width, format))
            if (await exists(out)) continue
            if (encoded >= budget) {
              capped = true
              break
            }

            loaded ??= await src.load()
            await encodeVariant(loaded, out, family, width, format)
            encoded++
          }
          if (capped) break
        }
        if (capped) break
      }
    }

    for (const f of tmpFiles) await rm(f, { force: true })

    // ── Prune orphans ──────────────────────────────────────────────────
    // Skip entirely if nothing came back — a Sanity blip must never wipe
    // the whole directory.
    let pruned = 0
    if (referenced.size > 0) {
      for (const name of await readdir(root).catch(() => [] as string[])) {
        if (name === '_raw') continue
        const hash = name.split('-')[0]
        if (hash && !referenced.has(hash)) {
          await rm(join(root, name), { force: true })
          pruned++
        }
      }
    }

    return { result: { sources: sources.length, encoded, capped, pruned } }
  },
})

async function exists(path: string): Promise<boolean> {
  return stat(path).then(() => true, () => false)
}

/** Pixel dimensions via ffprobe — already a dependency of the encoder. */
async function probeSize(path: string): Promise<{ width: number; height: number } | null> {
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const run = promisify(execFile)
  try {
    const { stdout } = await run('ffprobe', [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path,
    ])
    const [w, h] = stdout.trim().split(',').map(Number)
    return w && h ? { width: w, height: h } : null
  }
  catch {
    return null
  }
}
