import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchRawFile, fetchLatestRelease, DocsFetchError } from '../../server/utils/githubDocs'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** The slice of a fetch Response `fetchRawFile` actually reads. */
function reply(status: number, body = '', headers: Record<string, string> = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    text: async () => body,
  }
}

describe('fetchRawFile', () => {
  it('returns the file text, fetched from raw.githubusercontent.com', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, '# Guide'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md')).resolves.toBe('# Guide')
    expect(fetchMock.mock.calls[0]![0]).toBe('https://raw.githubusercontent.com/lyoraeth/polynya/main/docs/guide.md')
  })

  // a missing translation is a normal answer, not an outage
  it('returns null for a file that does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(404)))
    await expect(fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/ru/guide.md')).resolves.toBeNull()
  })

  it('throws, carrying the status, when GitHub answers with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(503)))
    const error = await fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md').catch(e => e)
    expect(error).toBeInstanceOf(DocsFetchError)
    expect(error.status).toBe(503)
  })

  it('throws a DocsFetchError, not the raw one, when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')))
    await expect(fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md'))
      .rejects.toThrow(/failed: getaddrinfo ENOTFOUND/)
  })

  // the one genuinely new piece of robustness here: nothing else in the
  // codebase puts a ceiling on an outbound request
  it('aborts a request that hangs, and says so', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })))

    const pending = fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md', { timeoutMs: 50 })
    const assertion = expect(pending).rejects.toThrow(/timed out after 50ms/)
    await vi.advanceTimersByTimeAsync(60)
    await assertion
  })

  it('does not abort a request that answers in time', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, 'fine')))

    const pending = fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md', { timeoutMs: 50 })
    await expect(pending).resolves.toBe('fine')
    expect(vi.getTimerCount()).toBe(0) // the timeout was cleared, not left ticking
  })

  it('refuses a body too big to be a docs page — by its declared length, and by its actual one', async () => {
    const big = 512 * 1024 + 1
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, 'x', { 'content-length': String(big) })))
    await expect(fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md')).rejects.toThrow(/too big/)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, 'x'.repeat(big))))
    await expect(fetchRawFile('lyoraeth', 'polynya', 'main', 'docs/guide.md')).rejects.toThrow(/too big/)
  })
})

describe('fetchLatestRelease', () => {
  const release = (tag: unknown, url: unknown) => ({
    ...reply(200),
    json: async () => ({ tag_name: tag, html_url: url }),
  })

  it('returns the tag and the release page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      release('v0.3.1', 'https://github.com/lyoraeth/polynya/releases/tag/v0.3.1'),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLatestRelease('lyoraeth', 'polynya')).resolves.toEqual({
      tag: 'v0.3.1',
      url: 'https://github.com/lyoraeth/polynya/releases/tag/v0.3.1',
    })
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.github.com/repos/lyoraeth/polynya/releases/latest')
  })

  // a project that hasn't shipped yet is a normal state
  it('returns null when there is no release', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(404)))
    await expect(fetchLatestRelease('lyoraeth', 'polynya')).resolves.toBeNull()
  })

  it('throws on an error status, so the caller can tell it from "no release"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(403)))
    await expect(fetchLatestRelease('lyoraeth', 'polynya')).rejects.toBeInstanceOf(DocsFetchError)
  })

  it('refuses an answer that would put something odd on the page', async () => {
    // a tag that is not tag-shaped
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(release('<b>1</b>', 'https://github.com/lyoraeth/polynya/releases/tag/x')))
    await expect(fetchLatestRelease('lyoraeth', 'polynya')).rejects.toThrow(/unexpected shape/)

    // a link that leaves the repo
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(release('v1', 'https://evil.example/releases/v1')))
    await expect(fetchLatestRelease('lyoraeth', 'polynya')).rejects.toThrow(/unexpected shape/)

    // a repo whose name merely starts the same
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(release('v1', 'https://github.com/lyoraeth/polynya-evil/releases/tag/v1')))
    await expect(fetchLatestRelease('lyoraeth', 'polynya')).rejects.toThrow(/unexpected shape/)
  })

  it('wraps a network failure in DocsFetchError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')))
    await expect(fetchLatestRelease('lyoraeth', 'polynya')).rejects.toBeInstanceOf(DocsFetchError)
  })
})
