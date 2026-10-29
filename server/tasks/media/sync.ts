import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import {
  MEDIA_FORMATS, animatedBasename, detectAnimation, effectiveWidths, mediaBasename, sanityAssetHash,
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
      /** Only for sources that may be animated (a .webp or .gif asset):
       *  makes sure the animated original is stored even when every variant
       *  already exists — `load` only runs when one is missing. */
      probe?:    () => Promise<void>
    }
    const sources: Source[] = []
    const tmpFiles: string[] = []

    // CMS images: covers (both families — the case study crops below xl),
    // project covers (full only — the showcase never crops them) and body-
    // gallery images of posts and projects (full only — inline text-column
    // images).
    if (cfg.sanityProjectId) {
      const client = createSanityClient(cfg.sanityProjectId, cfg.sanityDataset)
      const rows = await client.fetch<{
        _type:   string
        cover:   { url: string | null; width: number | null } | null
        poster:  { url: string | null; width: number | null } | null
        gallery: { url: string | null; width: number | null }[] | null
      }[]>(`
        *[_type in ["work", "post", "project"] && !(_id in path("drafts.**"))]{
          _type,
          "cover": cover.asset->{ url, "width": metadata.dimensions.width },
          "poster": poster.asset->{ url, "width": metadata.dimensions.width },
          "gallery": gallery[].image.asset->{ url, "width": metadata.dimensions.width }
        }
      `)

      /*
       * Sanity's CDN negotiates the format by Accept: a client that doesn't
       * say it takes WebP gets an animated WebP as a PNG of its first frame.
       * A browser says it, a server fetch (Accept: anything) doesn't — so the
       * pipeline asks for the formats it handles explicitly. A still original
       * comes back in its own format either way.
       */
      const fetchAsset = async (url: string) => {
        const res = await fetch(url, { headers: { Accept: 'image/webp,image/gif,image/png,image/jpeg,image/*;q=0.8' } })
        if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`)
        return new Uint8Array(await res.arrayBuffer())
      }

      /** Stores the original of an animated source; returns its kind, or null
       *  for a still one (recorded too, so it isn't fetched again). */
      const storeIfAnimated = async (hash: string, bytes: Uint8Array) => {
        const kind = detectAnimation(bytes)
        if (!kind) {
          await writeFile(join(root, `${hash}-still`), '')
          return null
        }
        const stored = join(root, animatedBasename(hash, kind))
        if (!await exists(stored)) await writeFile(stored, bytes)
        return kind
      }

      const seen = new Set<string>()
      const addCms = (url: string | null | undefined, width: number | null | undefined, families: MediaFamily[]) => {
        const hash = sanityAssetHash(url)
        if (!hash || !url || !width || seen.has(hash)) return
        seen.add(hash)
        const mayAnimate = /\.(?:webp|gif)(?:\?|$)/i.test(url)
        sources.push({
          hash,
          width,
          families,
          probe: mayAnimate
            ? async () => {
              const known = await exists(join(root, `${hash}-still`))
                || await exists(join(root, animatedBasename(hash, 'webp')))
                || await exists(join(root, animatedBasename(hash, 'gif')))
              if (!known) await storeIfAnimated(hash, await fetchAsset(url))
            }
            : undefined,
          load: async () => {
            const bytes = await fetchAsset(url)

            // An animated source is stored as is, and only its first frame goes
            // through the encoder — the variants are the poster.
            const kind = mayAnimate ? await storeIfAnimated(hash, bytes) : null
            if (kind) {
              const frame = join(tmpdir(), `media-src-${hash}-frame.${kind}`)
              await extractFirstFrame(bytes, kind, frame)
              tmpFiles.push(frame)
              return frame
            }

            const file = join(tmpdir(), `media-src-${hash}.png`)
            await writeFile(file, bytes)
            tmpFiles.push(file)
            return file
          },
        })
      }

      for (const row of rows) {
        addCms(row.cover?.url, row.cover?.width, row._type === 'project' ? ['full'] : ['cover', 'full'])
        for (const g of row.gallery ?? []) addCms(g?.url, g?.width, ['full'])
        // a work card's poster: drawn at the card's 4:3, never cropped
        addCms(row.poster?.url, row.poster?.width, ['full'])
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
      // cheap once settled: a marker or a stored animation answers it on disk
      await src.probe?.().catch((error: unknown) => console.error('[media:sync] probe', src.hash, error))
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
        // `_`-named entries are not variants: the raw sources, the docs cache
        if (name.startsWith('_')) continue
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
