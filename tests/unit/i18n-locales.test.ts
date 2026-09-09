import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Structural integrity between the two locale files — not a content review
 * (translations are reviewed by hand), just the invariants a silent drift
 * would otherwise need a manual grep audit to catch: every key exists on
 * both sides, every interpolation placeholder is the same set, and every
 * array (specs/jobs/lead/credits/…) has the same shape.
 *
 * Read via fs, not `import '…json'`: @intlify/unplugin-vue-i18n intercepts
 * imports of these exact files and compiles them into message-compiler AST,
 * not plain data — the same reason useSiteSearch.ts can't import them
 * directly either (see LEGAL_PAGE_TITLES there).
 */
// process.cwd() rather than import.meta.url: vitest's module URLs aren't
// real file:// URLs, so fileURLToPath() rejects them.
const localesDir = resolve(process.cwd(), 'i18n/locales')
const en = JSON.parse(readFileSync(resolve(localesDir, 'en.json'), 'utf-8'))
const ru = JSON.parse(readFileSync(resolve(localesDir, 'ru.json'), 'utf-8'))

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function flatten(obj: Record<string, JsonValue>, prefix = ''): Map<string, JsonValue> {
  const out = new Map<string, JsonValue>()
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of flatten(value as Record<string, JsonValue>, path)) out.set(k, v)
    } else {
      out.set(path, value)
    }
  }
  return out
}

function placeholders(value: JsonValue): string[] | null {
  if (typeof value !== 'string') return null
  return [...value.matchAll(/\{([^}]+)\}/g)].map(m => m[1]!).sort()
}

const enFlat = flatten(en)
const ruFlat = flatten(ru)

describe('i18n locale files stay structurally mirrored', () => {
  it('has no key present in one locale and missing from the other', () => {
    const enKeys = new Set(enFlat.keys())
    const ruKeys = new Set(ruFlat.keys())

    const onlyEn = [...enKeys].filter(k => !ruKeys.has(k))
    // English CLDR pluralization has no "few" form (usePlural's enPlural
    // only ever returns 'one' | 'many') — a `..._few` leaf is legitimately
    // ru.json-only, not drift. Anything else missing from en.json is.
    const onlyRu = [...ruKeys].filter(k => !enKeys.has(k) && !k.endsWith('_few'))

    expect(onlyEn, `keys only in en.json: ${onlyEn.join(', ')}`).toHaveLength(0)
    expect(onlyRu, `keys only in ru.json (excluding _few): ${onlyRu.join(', ')}`).toHaveLength(0)
  })

  it('uses the same interpolation placeholders on both sides of every key', () => {
    const mismatches: string[] = []
    for (const [key, enValue] of enFlat) {
      if (!ruFlat.has(key)) continue // reported by the key-parity test above
      const pe = placeholders(enValue)
      const pr = placeholders(ruFlat.get(key)!)
      if (pe === null || pr === null) continue
      if (JSON.stringify(pe) !== JSON.stringify(pr)) {
        mismatches.push(`${key}: en=${JSON.stringify(pe)} ru=${JSON.stringify(pr)}`)
      }
    }
    expect(mismatches, mismatches.join('\n')).toHaveLength(0)
  })

  it('keeps every array (specs, jobs, lead, credits, …) the same length on both sides', () => {
    function arrayPaths(obj: Record<string, JsonValue>, prefix = ''): string[] {
      const out: string[] = []
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (Array.isArray(value)) out.push(path)
        else if (value !== null && typeof value === 'object') out.push(...arrayPaths(value as Record<string, JsonValue>, path))
      }
      return out
    }
    function at(obj: Record<string, JsonValue>, path: string): JsonValue {
      return path.split('.').reduce<JsonValue>((o, k) => (o as any)?.[k], obj)
    }

    const mismatches: string[] = []
    for (const path of arrayPaths(en)) {
      const enArr = at(en, path) as JsonValue[]
      const ruArr = at(ru, path) as JsonValue[] | undefined
      if (!Array.isArray(ruArr)) { mismatches.push(`${path}: missing in ru.json`); continue }
      if (enArr.length !== ruArr.length) mismatches.push(`${path}: en=${enArr.length} ru=${ruArr.length}`)
    }
    expect(mismatches, mismatches.join('\n')).toHaveLength(0)
  })
})
