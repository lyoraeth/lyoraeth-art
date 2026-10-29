import { repoRawUrl } from '#shared/docs'

/** A hung GitHub request must not hang a page load with it. */
const TIMEOUT_MS = 8_000

/** A docs page is prose. Anything bigger than this isn't one, and it would
 *  end up in a cached response — refuse rather than hold it. */
const MAX_BYTES = 512 * 1024

/** GitHub couldn't be reached, answered with an error, or sent something that
 *  isn't a docs page — as opposed to the file simply not existing. */
export class DocsFetchError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'DocsFetchError'
  }
}

/**
 * One file's text from `raw.githubusercontent.com`.
 *
 * Returns `null` when the file doesn't exist (404) — a normal answer, e.g. a
 * translation that hasn't been written. Anything else that goes wrong (a timeout,
 * a network error, a 5xx, an oversized body) throws `DocsFetchError`, so a
 * caller can tell "no such page" from "GitHub is having a moment".
 */
export async function fetchRawFile(
  owner: string,
  repo: string,
  ref: string,
  path: string,
  { timeoutMs = TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<string | null> {
  const url = repoRawUrl(owner, repo, ref, path)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (res.status === 404) return null
    if (!res.ok) throw new DocsFetchError(`GitHub answered ${res.status} for ${path}`, res.status)

    const declared = Number(res.headers.get('content-length'))
    if (declared > MAX_BYTES) throw new DocsFetchError(`${path} is ${declared} bytes — too big for a docs page`)

    const text = await res.text()
    if (text.length > MAX_BYTES) throw new DocsFetchError(`${path} is too big for a docs page`)
    return text
  }
  catch (error) {
    if (error instanceof DocsFetchError) throw error
    if (controller.signal.aborted) throw new DocsFetchError(`fetching ${path} timed out after ${timeoutMs}ms`)
    throw new DocsFetchError(`fetching ${path} failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  finally {
    clearTimeout(timer)
  }
}

/** A release as the site shows it: the tag, and where to read about it. */
export interface LatestRelease {
  tag: string
  url: string
}

/**
 * The repository's latest published release from the GitHub API.
 *
 * Returns `null` when there is none (404) — a normal state for a project
 * that hasn't shipped. Anything else that goes wrong throws `DocsFetchError`,
 * like `fetchRawFile`. The answer is checked rather than trusted: it ends up
 * on the page as text and as a link, so the tag must look like a tag and the
 * URL must stay inside the repo.
 */
export async function fetchLatestRelease(
  owner: string,
  repo: string,
  { timeoutMs = TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<LatestRelease | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      signal:  controller.signal,
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lyoraeth.art' },
    })
    if (res.status === 404) return null
    if (!res.ok) throw new DocsFetchError(`GitHub answered ${res.status} for the latest release`, res.status)

    const body = await res.json() as { tag_name?: unknown; html_url?: unknown }
    const tag = typeof body.tag_name === 'string' ? body.tag_name : ''
    const url = typeof body.html_url === 'string' ? body.html_url : ''
    if (!/^[\w][\w.+-]{0,63}$/.test(tag) || !url.startsWith(`https://github.com/${owner}/${repo}/`)) {
      throw new DocsFetchError('the latest release has an unexpected shape')
    }
    return { tag, url }
  }
  catch (error) {
    if (error instanceof DocsFetchError) throw error
    if (controller.signal.aborted) throw new DocsFetchError(`fetching the latest release timed out after ${timeoutMs}ms`)
    throw new DocsFetchError(`fetching the latest release failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  finally {
    clearTimeout(timer)
  }
}
