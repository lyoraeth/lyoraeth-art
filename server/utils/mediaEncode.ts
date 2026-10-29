import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import type { AnimatedKind, MediaFamily, MediaFormat } from '#shared/media'

const run = promisify(execFile)

/** libwebp refuses either dimension over this. Full-page screenshots blow
 *  past it on the long edge; the source formats and jxl have no such limit. */
const WEBP_MAX = 16383

/**
 * The `-vf` filter chain shared by every format: drop alpha (screenshots
 * have none), crop to 4:3 from the top for `cover`, scale to the target
 * width without ever upscaling past the source.
 *
 * `clampLongEdge` adds the webp-only second scale that pulls the long edge
 * back under 16383 — a no-op when the image already fits.
 */
function filterChain(family: MediaFamily, width: number, clampLongEdge: boolean): string {
  const parts = ['format=rgb24']
  if (family === 'cover') {
    // The largest 4:3 rectangle that fits the source: whichever of width/
    // height is the binding constraint sets the ratio, the other is derived,
    // so the result is always exactly 4:3. Anchored top (y=0), centred
    // horizontally — a tall screenshot keeps its head, a wide one its middle.
    parts.push(
      `crop='min(iw,ih*4/3)':'min(ih,iw*3/4)':'(iw-min(iw,ih*4/3))/2':0`,
    )
  }
  parts.push(`scale='min(iw,${width})':-2:flags=lanczos`)
  if (clampLongEdge) {
    parts.push(
      `scale='if(gt(iw,ih),min(iw,${WEBP_MAX}),-2)':'if(gt(iw,ih),-2,min(ih,${WEBP_MAX}))':flags=lanczos`,
    )
  }
  return parts.join(',')
}

/** Per-format encoder args — the settings tuned by hand in ffmpeg against a
 *  real case screenshot (Squoosh choked on the size). */
const ENCODER_ARGS: Record<Exclude<MediaFormat, 'jxl'>, string[]> = {
  // full chroma (4:4:4) — text and flat UI colour don't survive subsampling
  avif: ['-c:v', 'libaom-av1', '-crf', '23', '-cpu-used', '4', '-pix_fmt', 'yuv444p', '-still-picture', '1'],
  webp: ['-c:v', 'libwebp', '-preset', 'text', '-lossless', '0', '-q:v', '88', '-compression_level', '6'],
  jpg:  ['-c:v', 'mjpeg', '-q:v', '3', '-pix_fmt', 'yuvj444p', '-huffman', 'optimal'],
}

/** cjxl, not ffmpeg's libjxl: only cjxl exposes `-p` (progressive), which is
 *  the whole reason jxl leads the fallback order. */
const JXL_ARGS = ['-d', '1.8', '-e', '7', '-p']

async function ffmpeg(input: string, vf: string, extra: string[], out: string): Promise<void> {
  await mkdir(dirname(out), { recursive: true })
  // one frame: a GIF would otherwise be encoded whole
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-vf', vf, '-frames:v', '1', ...extra, out])
}

/**
 * Encode one delivery variant from a local source image.
 *
 * @param source - path to the source file (a PNG: the Sanity original, or a
 * hand-placed file under `_raw/`) — already on disk, fetching is the caller's job
 * @param out - full destination path, extension included
 */
export async function encodeVariant(
  source: string,
  out: string,
  family: MediaFamily,
  width: number,
  format: MediaFormat,
): Promise<void> {
  if (format === 'jxl') {
    // cjxl can't scale or crop, so ffmpeg does the geometry into a temp PNG first
    const tmp = join(tmpdir(), `media-${randomBytes(8).toString('hex')}.png`)
    try {
      await ffmpeg(source, filterChain(family, width, false), [], tmp)
      await mkdir(dirname(out), { recursive: true })
      await run('cjxl', [tmp, out, ...JXL_ARGS])
    }
    finally {
      await rm(tmp, { force: true })
    }
    return
  }

  await ffmpeg(source, filterChain(family, width, format === 'webp'), ENCODER_ARGS[format], out)
}

/**
 * The first frame of an animated source as a file `ffmpeg` reads as a still,
 * for the poster variants. A GIF is read as is (`ffmpeg` takes its first
 * frame); an animated WebP is not decodable by `ffmpeg` at all, so `webpmux`
 * cuts frame 1 out into a single-frame WebP first.
 *
 * @param bytes - the animated source
 * @param kind - which format `bytes` is, from `detectAnimation`
 * @param out - destination path for the first-frame file
 */
export async function extractFirstFrame(bytes: Uint8Array, kind: AnimatedKind, out: string): Promise<void> {
  await mkdir(dirname(out), { recursive: true })
  if (kind === 'gif') {
    await writeFile(out, bytes)
    return
  }
  const src = `${out}.src`
  try {
    await writeFile(src, bytes)
    await run('webpmux', ['-get', 'frame', '1', src, '-o', out])
  }
  finally {
    await rm(src, { force: true })
  }
}
