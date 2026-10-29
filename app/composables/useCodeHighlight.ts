import type { HighlighterCore } from 'shiki/core'

/*
 * Syntax highlighting for rendered markdown, applied after mount.
 *
 * Shiki is loaded on demand — a page with no fenced code never pays for it,
 * and each grammar is its own chunk fetched only when a block of that language
 * is actually on the page (the same discipline as mermaid on the post page).
 * `useMarkdown` stays synchronous and keeps emitting a plain
 * `<pre><code class="language-x">`; this progressively enhances it, so the
 * cost of the approach is a brief first paint of unhighlighted code.
 */

/** Fence tags → shiki's own language names. */
const ALIASES: Record<string, string> = {
  js: 'javascript', ts: 'typescript', py: 'python', rs: 'rust',
  ps1: 'powershell', pwsh: 'powershell', sh: 'bash', shell: 'bash',
  yml: 'yaml', cs: 'csharp',
}

/** Written out, not computed: the bundler can only split a chunk per grammar
 *  from a literal `import('…')`. A fence in any other language (`text`, or one
 *  not listed) simply stays plain. */
const GRAMMARS: Record<string, () => Promise<unknown>> = {
  bash:       () => import('@shikijs/langs/bash'),
  csharp:     () => import('@shikijs/langs/csharp'),
  css:        () => import('@shikijs/langs/css'),
  go:         () => import('@shikijs/langs/go'),
  html:       () => import('@shikijs/langs/html'),
  ini:        () => import('@shikijs/langs/ini'),
  javascript: () => import('@shikijs/langs/javascript'),
  json:       () => import('@shikijs/langs/json'),
  powershell: () => import('@shikijs/langs/powershell'),
  python:     () => import('@shikijs/langs/python'),
  rust:       () => import('@shikijs/langs/rust'),
  toml:       () => import('@shikijs/langs/toml'),
  typescript: () => import('@shikijs/langs/typescript'),
  yaml:       () => import('@shikijs/langs/yaml'),
}

const THEME = 'github-light'

// shiki's FontStyle bit flags
const ITALIC = 1
const BOLD = 2
const UNDERLINE = 4

let highlighter: Promise<HighlighterCore> | null = null
const loaded = new Set<string>()

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])
    return createHighlighterCore({
      themes: [import('@shikijs/themes/github-light')],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighter
}

/** `language-rust` → `rust`, through the aliases; null for a block with none or
 *  one we don't ship a grammar for. */
function grammarFor(code: Element): string | null {
  const tag = /(?:^|\s)language-([\w+-]+)/.exec(code.className)?.[1]?.toLowerCase()
  if (!tag) return null
  const name = ALIASES[tag] ?? tag
  return name in GRAMMARS ? name : null
}

/** Replaces a code block's text with colored spans, built as DOM nodes — the
 *  text goes in through `textContent`, never parsed as HTML. */
function paint(code: Element, lines: { content: string; color?: string; fontStyle?: number }[][]) {
  const fragment = document.createDocumentFragment()
  lines.forEach((line, i) => {
    if (i > 0) fragment.append('\n')
    for (const token of line) {
      const span = document.createElement('span')
      span.textContent = token.content
      if (token.color) span.style.color = token.color
      const style = token.fontStyle ?? 0
      if (style & ITALIC) span.style.fontStyle = 'italic'
      if (style & BOLD) span.style.fontWeight = '600'
      if (style & UNDERLINE) span.style.textDecoration = 'underline'
      fragment.append(span)
    }
  })
  code.replaceChildren(fragment)
}

export function useCodeHighlight() {
  /** Highlights every not-yet-highlighted fenced block under `root`. Safe to
   *  call again after the markup changes (a locale switch re-renders it). */
  async function highlightAll(root: ParentNode = document) {
    const blocks = [...root.querySelectorAll('pre > code[class*="language-"]')]
      .filter((code): code is HTMLElement => code instanceof HTMLElement && !code.dataset.highlighted)
      .map(code => ({ code, lang: grammarFor(code) }))
      .filter((b): b is { code: HTMLElement; lang: string } => b.lang !== null)
    if (blocks.length === 0) return

    const shiki = await getHighlighter()

    for (const { code, lang } of blocks) {
      // the markup may have been swapped while a grammar was downloading
      if (!code.isConnected) continue
      try {
        if (!loaded.has(lang)) {
          await shiki.loadLanguage(GRAMMARS[lang]!() as never)
          loaded.add(lang)
        }
        const { tokens } = shiki.codeToTokens(code.textContent ?? '', { lang, theme: THEME })
        if (!code.isConnected) continue
        paint(code, tokens)
        code.dataset.highlighted = '1'
      }
      catch {
        // a block that won't highlight stays plain — never worth breaking the page for
      }
    }
  }

  return { highlightAll }
}
