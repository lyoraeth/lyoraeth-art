import { describe, it, expect } from 'vitest'
import type { DocsIndexPayload } from '../../shared/docs'

const heading = (text: string, level: 2 | 3 = 2) => ({
  level, text, id: text.toLowerCase().replace(/\s+/g, '-'),
})

const INDEX: DocsIndexPayload = {
  title: { en: 'Docs', ru: 'Документация' },
  paired: true,
  sections: [
    {
      heading: { en: null, ru: null },
      pages: [{ key: 'readme', landing: true, title: { en: 'About', ru: 'О проекте' }, path: { en: 'README.md', ru: 'README.ru.md' } }],
    },
    {
      heading: { en: 'Using the app', ru: 'Использование' },
      pages: [
        { key: 'guide', landing: false, title: { en: 'User guide', ru: 'Руководство' }, path: { en: 'docs/guide.md', ru: 'docs/ru/guide.md' } },
        { key: 'faq', landing: false, title: { en: 'Known limitations', ru: 'Ограничения' }, path: { en: 'docs/faq.md', ru: null } },
      ],
    },
    {
      heading: { en: 'Modules', ru: 'Модули' },
      pages: [
        { key: 'module-api', landing: false, title: { en: 'Module API', ru: 'API модулей' }, path: { en: 'docs/module-api.md', ru: 'docs/ru/module-api.md' } },
      ],
    },
  ],
  headings: {
    guide:        { en: [heading('Hotkeys'), heading('Weather', 3)], ru: [heading('Горячие клавиши'), heading('Погода', 3)] },
    faq:          { en: [heading('Hotkeys do not work')], ru: null },
    'module-api': { en: [heading('Hotkeys API')], ru: [heading('API горячих клавиш')] },
  },
}

function searcher(locale: string, index: DocsIndexPayload | null = INDEX) {
  return useDocsSearch(() => index, () => locale)
}

describe('useDocsSearch', () => {
  it('returns nothing below the minimum query length, or with no index yet', () => {
    expect(searcher('en').search('g')).toEqual([])
    expect(searcher('en').minQueryLength).toBe(2)
    expect(searcher('en', null).search('guide')).toEqual([])
  })

  it('matches a page title in either language, whatever the active locale', () => {
    expect(searcher('en').search('руководство').map(r => r.pageKey)).toEqual(['guide'])
    expect(searcher('ru').search('user guide').map(r => r.pageKey)).toEqual(['guide'])
  })

  it('shows a title hit in the current language, with its section', () => {
    const [hit] = searcher('ru').search('user guide')
    expect(hit).toMatchObject({ key: 'guide', title: 'Руководство', section: 'Использование', heading: null, hash: null })
  })

  it('matches headings and links to their anchor', () => {
    const hits = searcher('en').search('weather')
    expect(hits).toEqual([{
      key: 'guide#weather', pageKey: 'guide', title: 'User guide', section: 'Using the app',
      heading: 'Weather', hash: '#weather',
    }])
  })

  // the anchor is an id derived from that language's text — a hit on the
  // other language's heading would link to an id the displayed page lacks
  it('matches headings in the displayed language only', () => {
    expect(searcher('ru').search('weather')).toEqual([])
    expect(searcher('ru').search('погода').map(r => r.key)).toEqual(['guide#погода'])
  })

  it('falls back to the EN headings for a page with no RU text', () => {
    expect(searcher('ru').search('do not work').map(r => r.key)).toEqual(['faq#hotkeys-do-not-work'])
  })

  it('ranks a title hit ahead of headings, and keeps nav order within each', () => {
    // "api" is in a page title (Module API) and in a heading elsewhere on
    // that same page (Hotkeys API) — the title hit comes first
    const keys = searcher('en').search('api').map(r => r.key)
    expect(keys).toEqual(['module-api', 'module-api#hotkeys-api'])
  })

  it('skips the landing (README) entry', () => {
    expect(searcher('en').search('about')).toEqual([])
  })

  it('caps the list', () => {
    const many: DocsIndexPayload = {
      ...INDEX,
      headings: { guide: { en: Array.from({ length: 20 }, (_, i) => heading(`Hotkeys ${i}`)), ru: null } },
    }
    expect(searcher('en', many).search('hotkeys')).toHaveLength(8)
  })
})

// vitest runs outside Nuxt, so auto-imports don't resolve — import manually
import { useDocsSearch } from '../../app/composables/useDocsSearch'
