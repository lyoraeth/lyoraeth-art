import { describe, it, expect } from 'vitest'
import {
  parseRepoUrl, isExternalHref, resolveRepoRelativePath, isLandingPath, pageKey,
  parseSummary, buildDocsIndex, docsPages, docsPathMap, classifyDocLink,
  docLinkTarget, stripLangSwitcher, repoBlobUrl, repoRawUrl,
} from '../../shared/docs'
import { extractHeadings } from '../../shared/markdown'

// polynya's real docs/SUMMARY.md and docs/ru/SUMMARY.md, verbatim — the
// fixtures the design was checked against (the trees match in shape but not in
// file names: CONTRIBUTING.md / SECURITY.md live at the repo root in EN and in
// docs/ru/ in RU, the README is README.ru.md).
const SUMMARY_EN = `# Polynya documentation

**English** · [Русский](ru/SUMMARY.md) · [简体中文](zh/SUMMARY.md) · [日本語](ja/SUMMARY.md)

* [About the project (README)](../README.md)

## Using Polynya
* [User guide](guide.md)
* [Notifications, AI agents and the terminal](notifications.md)
* [Known limitations and FAQ](troubleshooting.md)

## Writing modules
* [Module API and protocol](module-api.md)
* [Module examples](module-examples.md)

## Internals
* [Architecture and rendering](architecture.md)
* [Building and contributing](../CONTRIBUTING.md)
* [Security policy](../SECURITY.md)
`

const SUMMARY_RU = `# Содержание документации Polynya

[English](../SUMMARY.md) · **Русский** · [简体中文](../zh/SUMMARY.md) · [日本語](../ja/SUMMARY.md)

* [О проекте (README)](../../README.ru.md)

## Использование
* [Руководство пользователя](guide.md)
* [Уведомления, ИИ-агенты и терминал](notifications.md)
* [Известные ограничения и FAQ](troubleshooting.md)

## Разработка модулей
* [API и протокол модулей](module-api.md)
* [Примеры создания модулей](module-examples.md)

## Внутреннее устройство
* [Архитектура и рендер](architecture.md)
* [Сборка и участие в разработке](contributing.md)
* [Политика безопасности](security.md)
`

describe('parseRepoUrl', () => {
  it('reads owner and repo from a github.com URL', () => {
    expect(parseRepoUrl('https://github.com/lyoraeth/polynya')).toEqual({ owner: 'lyoraeth', repo: 'polynya' })
    expect(parseRepoUrl('https://github.com/lyoraeth/polynya/')).toEqual({ owner: 'lyoraeth', repo: 'polynya' })
    expect(parseRepoUrl('https://github.com/lyoraeth/polynya.git')).toEqual({ owner: 'lyoraeth', repo: 'polynya' })
  })

  // docs are rendered through v-html on our domain — only our own repos
  it('rejects any other owner, host, or shape', () => {
    expect(parseRepoUrl('https://github.com/someone-else/polynya')).toBeNull()
    expect(parseRepoUrl('https://gitlab.com/lyoraeth/polynya')).toBeNull()
    expect(parseRepoUrl('http://github.com/lyoraeth/polynya')).toBeNull()
    expect(parseRepoUrl('https://github.com/lyoraeth/polynya/tree/main')).toBeNull()
    expect(parseRepoUrl('https://github.com/lyoraeth')).toBeNull()
    expect(parseRepoUrl(null)).toBeNull()
  })
})

describe('isExternalHref', () => {
  it('recognises schemes and protocol-relative URLs, not paths', () => {
    expect(isExternalHref('https://example.com')).toBe(true)
    expect(isExternalHref('mailto:a@b.c')).toBe(true)
    expect(isExternalHref('//cdn.example.com/x')).toBe(true)
    expect(isExternalHref('guide.md')).toBe(false)
    expect(isExternalHref('../README.md')).toBe(false)
    expect(isExternalHref('#top')).toBe(false)
  })
})

describe('resolveRepoRelativePath', () => {
  it('resolves plain, ./ and ../ targets against the base directory', () => {
    expect(resolveRepoRelativePath('docs', 'guide.md')).toBe('docs/guide.md')
    expect(resolveRepoRelativePath('docs', './guide.md')).toBe('docs/guide.md')
    expect(resolveRepoRelativePath('docs', '../README.md')).toBe('README.md')
    expect(resolveRepoRelativePath('docs/ru', '../../README.ru.md')).toBe('README.ru.md')
    expect(resolveRepoRelativePath('docs/ru', '../guide.md')).toBe('docs/guide.md')
    expect(resolveRepoRelativePath('', 'docs/guide.md')).toBe('docs/guide.md')
  })

  it('treats a leading slash as the repo root', () => {
    expect(resolveRepoRelativePath('docs/ru', '/docs/guide.md')).toBe('docs/guide.md')
  })

  it('ignores a hash and a query', () => {
    expect(resolveRepoRelativePath('docs', 'guide.md#install')).toBe('docs/guide.md')
    expect(resolveRepoRelativePath('docs', 'guide.md?plain=1')).toBe('docs/guide.md')
  })

  // not clamped to the root: a hostile `../../..` must not become a real path
  it('returns null for a path that climbs out of the repo, or points at nothing', () => {
    expect(resolveRepoRelativePath('docs', '../../x.md')).toBeNull()
    expect(resolveRepoRelativePath('', '../x.md')).toBeNull()
    expect(resolveRepoRelativePath('docs', '#section')).toBeNull()
    expect(resolveRepoRelativePath('docs', '..')).toBeNull()
  })
})

describe('isLandingPath / pageKey', () => {
  it('flags READMEs, in any locale suffix, as the landing page', () => {
    expect(isLandingPath('README.md')).toBe(true)
    expect(isLandingPath('README.ru.md')).toBe(true)
    expect(isLandingPath('docs/readme.md')).toBe(true)
    expect(isLandingPath('docs/guide.md')).toBe(false)
    expect(isLandingPath('docs/not-a-readme.md')).toBe(false)
  })

  it('flattens a file name into a URL-safe key', () => {
    expect(pageKey('docs/guide.md')).toBe('guide')
    expect(pageKey('CONTRIBUTING.md')).toBe('contributing')
    expect(pageKey('docs/Module API (v2).md')).toBe('module-api-v2')
    expect(pageKey('docs/.md')).toBe('page')
  })
})

describe('parseSummary', () => {
  const en = parseSummary(SUMMARY_EN, 'docs')

  it('reads the title and groups entries under their ## headings', () => {
    expect(en.title).toBe('Polynya documentation')
    expect(en.sections.map(s => s.heading)).toEqual([null, 'Using Polynya', 'Writing modules', 'Internals'])
    expect(en.sections.map(s => s.entries.length)).toEqual([1, 3, 2, 3])
  })

  it('puts entries that come before any ## into an ungrouped section', () => {
    expect(en.sections[0]).toEqual({
      heading: null,
      entries: [{ title: 'About the project (README)', path: 'README.md' }],
    })
  })

  it('resolves every path against the file’s own directory, ../ included', () => {
    expect(en.sections.flatMap(s => s.entries.map(e => e.path))).toEqual([
      'README.md',
      'docs/guide.md', 'docs/notifications.md', 'docs/troubleshooting.md',
      'docs/module-api.md', 'docs/module-examples.md',
      'docs/architecture.md', 'CONTRIBUTING.md', 'SECURITY.md',
    ])
  })

  it('skips the language-switcher line instead of reading it as content', () => {
    const titles = en.sections.flatMap(s => s.entries.map(e => e.title))
    expect(titles).not.toContain('Русский')
    expect(titles).not.toContain('English')
  })

  it('reads the RU file from docs/ru, where the paths differ', () => {
    const ru = parseSummary(SUMMARY_RU, 'docs/ru')
    expect(ru.title).toBe('Содержание документации Polynya')
    expect(ru.sections.map(s => s.heading)).toEqual([null, 'Использование', 'Разработка модулей', 'Внутреннее устройство'])
    expect(ru.sections.flatMap(s => s.entries.map(e => e.path))).toEqual([
      'README.ru.md',
      'docs/ru/guide.md', 'docs/ru/notifications.md', 'docs/ru/troubleshooting.md',
      'docs/ru/module-api.md', 'docs/ru/module-examples.md',
      'docs/ru/architecture.md', 'docs/ru/contributing.md', 'docs/ru/security.md',
    ])
  })

  it('drops entries that are URLs, leave the repo, or are not markdown', () => {
    const nav = parseSummary([
      '# T',
      '* [site](https://example.com/page.md)',
      '* [up](../../outside.md)',
      '* [licence](../LICENSE)',
      '* [ok](ok.md "with a title")',
      '- [dash bullet](dash.md)',
    ].join('\n'), 'docs')
    expect(nav.sections).toEqual([{
      heading: null,
      entries: [
        { title: 'ok', path: 'docs/ok.md' },
        { title: 'dash bullet', path: 'docs/dash.md' },
      ],
    }])
  })

  it('omits a ## section with nothing in it', () => {
    const nav = parseSummary('# T\n\n## Empty\n\n## Full\n* [a](a.md)\n', 'docs')
    expect(nav.sections.map(s => s.heading)).toEqual(['Full'])
  })
})

describe('buildDocsIndex', () => {
  const en = parseSummary(SUMMARY_EN, 'docs')
  const ru = parseSummary(SUMMARY_RU, 'docs/ru')

  it('pairs the two trees by position, keyed by the EN file names', () => {
    const index = buildDocsIndex(en, ru)
    expect(index.paired).toBe(true)
    expect(docsPages(index).map(p => p.key)).toEqual([
      'readme', 'guide', 'notifications', 'troubleshooting',
      'module-api', 'module-examples', 'architecture', 'contributing', 'security',
    ])
  })

  it('matches pages whose RU file name or location differs from EN', () => {
    const index = buildDocsIndex(en, ru)
    const contributing = docsPages(index).find(p => p.key === 'contributing')!
    expect(contributing.path).toEqual({ en: 'CONTRIBUTING.md', ru: 'docs/ru/contributing.md' })
    expect(contributing.title).toEqual({ en: 'Building and contributing', ru: 'Сборка и участие в разработке' })

    const readme = docsPages(index).find(p => p.key === 'readme')!
    expect(readme.landing).toBe(true)
    expect(readme.path).toEqual({ en: 'README.md', ru: 'README.ru.md' })
  })

  it('carries both languages’ headings and titles', () => {
    const index = buildDocsIndex(en, ru)
    expect(index.title).toEqual({ en: 'Polynya documentation', ru: 'Содержание документации Polynya' })
    expect(index.sections[1]!.heading).toEqual({ en: 'Using Polynya', ru: 'Использование' })
  })

  // a section or entry on one side only: position-matching would put the
  // wrong page under a title, so nothing is paired at all
  it('refuses to pair trees of different shape', () => {
    const longer = parseSummary(`${SUMMARY_RU}* [Extra](extra.md)\n`, 'docs/ru')
    const index = buildDocsIndex(en, longer)
    expect(index.paired).toBe(false)
    expect(index.title.ru).toBeNull()
    for (const page of docsPages(index)) {
      expect(page.title.ru).toBeNull()
      expect(page.path.ru).toBeNull()
    }
    // the EN side is untouched
    expect(docsPages(index)).toHaveLength(9)
  })

  it('works with no RU tree at all', () => {
    const index = buildDocsIndex(en, null)
    expect(index.paired).toBe(false)
    expect(docsPages(index)[1]!.title).toEqual({ en: 'User guide', ru: null })
  })

  it('keeps keys unique when two files flatten to the same name', () => {
    const nav = parseSummary('# T\n* [a](a/guide.md)\n* [b](b/guide.md)\n* [c](c/Guide.md)\n', '')
    expect(docsPages(buildDocsIndex(nav, null)).map(p => p.key)).toEqual(['guide', 'guide-2', 'guide-3'])
  })
})

describe('classifyDocLink', () => {
  const index = buildDocsIndex(parseSummary(SUMMARY_EN, 'docs'), parseSummary(SUMMARY_RU, 'docs/ru'))
  const map = docsPathMap(index)
  const from = 'docs/guide.md'

  it('sends a link to another docs page to its route key, keeping the hash', () => {
    expect(classifyDocLink('module-api.md', from, map)).toEqual({ kind: 'page', key: 'module-api', hash: '' })
    expect(classifyDocLink('module-api.md#hotkeys', from, map)).toEqual({ kind: 'page', key: 'module-api', hash: '#hotkeys' })
    expect(classifyDocLink('./notifications.md', from, map)).toEqual({ kind: 'page', key: 'notifications', hash: '' })
  })

  it('resolves a page that lives outside docs/ the same way', () => {
    expect(classifyDocLink('../CONTRIBUTING.md', from, map)).toEqual({ kind: 'page', key: 'contributing', hash: '' })
  })

  it('sends the README to the landing page', () => {
    expect(classifyDocLink('../README.md', from, map)).toEqual({ kind: 'landing', hash: '' })
    expect(classifyDocLink('../README.md#install', from, map)).toEqual({ kind: 'landing', hash: '#install' })
  })

  it('matches a link inside a RU page against the RU paths', () => {
    expect(classifyDocLink('module-api.md', 'docs/ru/guide.md', map)).toEqual({ kind: 'page', key: 'module-api', hash: '' })
    expect(classifyDocLink('../../README.ru.md', 'docs/ru/guide.md', map)).toEqual({ kind: 'landing', hash: '' })
  })

  it('sends any other repo file to github.com', () => {
    expect(classifyDocLink('../LICENSE', from, map)).toEqual({ kind: 'repo', path: 'LICENSE', hash: '' })
    expect(classifyDocLink('../proto/LICENSE', from, map)).toEqual({ kind: 'repo', path: 'proto/LICENSE', hash: '' })
  })

  it('leaves in-page anchors and absolute URLs alone', () => {
    expect(classifyDocLink('#install', from, map)).toEqual({ kind: 'anchor', hash: '#install' })
    expect(classifyDocLink('https://example.com/x', from, map)).toEqual({ kind: 'external', href: 'https://example.com/x' })
    expect(classifyDocLink('mailto:a@b.c', from, map)).toEqual({ kind: 'external', href: 'mailto:a@b.c' })
  })

  it('marks a link that climbs out of the repo as dead', () => {
    expect(classifyDocLink('../../../etc/passwd', from, map)).toEqual({ kind: 'dead' })
  })
})

describe('docLinkTarget', () => {
  const ctx = {
    page:    (key: string) => `/projects/polynya/docs/${key}`,
    landing: '/projects/polynya',
    repo:    { owner: 'lyoraeth', repo: 'polynya', ref: 'main' },
  }

  it('turns each kind of link into the href it should render with', () => {
    expect(docLinkTarget({ kind: 'anchor', hash: '#install' }, ctx)).toBe('#install')
    expect(docLinkTarget({ kind: 'page', key: 'module-api', hash: '#hotkeys' }, ctx)).toBe('/projects/polynya/docs/module-api#hotkeys')
    expect(docLinkTarget({ kind: 'landing', hash: '' }, ctx)).toBe('/projects/polynya')
    expect(docLinkTarget({ kind: 'repo', path: 'proto/LICENSE', hash: '' }, ctx))
      .toBe('https://github.com/lyoraeth/polynya/blob/main/proto/LICENSE')
  })

  it('keeps http(s) and mailto links, drops every other scheme', () => {
    expect(docLinkTarget({ kind: 'external', href: 'https://example.com/x' }, ctx)).toBe('https://example.com/x')
    expect(docLinkTarget({ kind: 'external', href: 'mailto:a@b.c' }, ctx)).toBe('mailto:a@b.c')
    expect(docLinkTarget({ kind: 'external', href: 'javascript:alert(1)' }, ctx)).toBeNull()
    expect(docLinkTarget({ kind: 'external', href: 'data:text/html,x' }, ctx)).toBeNull()
    expect(docLinkTarget({ kind: 'external', href: '//evil.example/x' }, ctx)).toBeNull()
  })

  it('renders a dead link as plain text', () => {
    expect(docLinkTarget({ kind: 'dead' }, ctx)).toBeNull()
  })
})

describe('stripLangSwitcher', () => {
  it('drops the switcher line mdBook-style docs carry under the title, EN and RU forms', () => {
    const en = '# User guide\n\n**English** · [Русский](ru/guide.md) · [简体中文](zh/guide.md) · [日本語](ja/guide.md)\n\nBody text.\n'
    expect(stripLangSwitcher(en)).toBe('# User guide\n\nBody text.\n')

    const ru = '# Руководство\n\n[English](../guide.md) · **Русский** · [简体中文](../zh/guide.md)\n\nТекст.\n'
    expect(stripLangSwitcher(ru)).toBe('# Руководство\n\nТекст.\n')
  })

  it('copes with CRLF line endings', () => {
    const md = '# T\r\n\r\n**English** · [Русский](ru/t.md)\r\n\r\nBody\r\n'
    expect(stripLangSwitcher(md)).toBe('# T\r\n\r\nBody\r\n')
  })

  it('leaves a page without one untouched', () => {
    const md = '# T\n\nPlain intro.\n'
    expect(stripLangSwitcher(md)).toBe(md)
  })

  // only a line that is *nothing but* bold/links around `·` counts
  it('leaves prose that merely contains a middle dot, and a switcher far down the page', () => {
    const prose = '# T\n\nVue · Nuxt · TypeScript are the stack.\n'
    expect(stripLangSwitcher(prose)).toBe(prose)

    const deep = `# T\n\n${'text\n\n'.repeat(4)}**English** · [Русский](ru/t.md)\n`
    expect(stripLangSwitcher(deep)).toBe(deep)
  })
})

describe('repo URLs', () => {
  it('builds a blob URL and a raw URL, encoding each path segment', () => {
    expect(repoBlobUrl('lyoraeth', 'polynya', 'main', 'docs/module api.md'))
      .toBe('https://github.com/lyoraeth/polynya/blob/main/docs/module%20api.md')
    expect(repoRawUrl('lyoraeth', 'polynya', 'main', 'docs/ru/guide.md'))
      .toBe('https://raw.githubusercontent.com/lyoraeth/polynya/main/docs/ru/guide.md')
  })
})

describe('extractHeadings', () => {
  it('lists h2/h3 with the ids the renderer stamps, and skips h1', () => {
    expect(extractHeadings('# Title\n\n## First part\ntext\n### Sub part\n\n## Второй раздел\n')).toEqual([
      { level: 2, text: 'First part', id: 'first-part' },
      { level: 3, text: 'Sub part', id: 'sub-part' },
      { level: 2, text: 'Второй раздел', id: 'второй-раздел' },
    ])
  })

  it('strips inline markup from the display text but derives the id from the raw heading', () => {
    const [h] = extractHeadings('## The `config.ini` keys\n')
    expect(h).toEqual({ level: 2, text: 'The config.ini keys', id: 'the-configini-keys' })
  })

  // a `## comment` in a shell or TOML example is not a heading
  it('ignores headings inside fenced code blocks', () => {
    const md = '## Real\n\n```toml\n## not a heading\n[module]\n```\n\n~~~\n## nor this\n~~~\n\n### Also real\n'
    expect(extractHeadings(md).map(h => h.text)).toEqual(['Real', 'Also real'])
  })

  it('keeps a trailing # that is part of the text, drops a closing ## run', () => {
    expect(extractHeadings('## C#\n## Closed ##\n').map(h => h.text)).toEqual(['C#', 'Closed'])
  })
})
