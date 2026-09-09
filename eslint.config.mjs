// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // studio/ is a separate Sanity Studio sub-project (its own package.json)
    // slated for its own rebuild later in the roadmap — not this app's lint
    // scope.
    ignores: ['studio/**'],
  },
  {
    rules: {
      // Object/interface members and consecutive declarations often line up
      // their values in a column here (see e.g. any server/api/*.get.ts
      // interface) — but not always; it's an editorial call made per block,
      // not a fixed rule (compare vitest.config.ts, which doesn't). Neither
      // "always one space" nor "always aligned" matches reality, and
      // forcing either produces as many false positives as it fixes — left
      // unenforced rather than wrongly enforced in one direction.
      '@stylistic/key-spacing': 'off',
      // Same story as key-spacing, but the alignment shows up in more AST
      // shapes than a short exceptions list can cover in this codebase —
      // plain properties, type members, destructured/variable declarations,
      // even the operands of a wrapped ternary (see e.g. Rating.vue's `??`/
      // `?`/`+` alignment). Off entirely, for the same reason.
      '@stylistic/no-multi-spaces': 'off',

      // Semicolons inside a single-line type literal (`{ en: string; ru: string }`),
      // none inside a multi-line one (`interface Foo {\n  a: string\n}`) —
      // matches every interface in server/api/*.
      '@stylistic/member-delimiter-style': ['error', {
        multiline:  { delimiter: 'none', requireLast: false },
        singleline: { delimiter: 'semi', requireLast: false },
      }],

      // No parens around a single arrow-function param — established
      // throughout (e.g. `entries.forEach(entry => {...})`).
      '@stylistic/arrow-parens': ['error', 'as-needed'],

      // JSON-LD object literals mix `'@type'`/`'@context'` (must be quoted,
      // not a valid bare identifier) with plain keys — "as-needed" is the
      // only mode that doesn't flag that mix as an inconsistency.
      '@stylistic/quote-props': ['error', 'as-needed'],

      // Vue 3 supports fragments; every shell layout and the homepage are
      // deliberately multi-root (see app.vue's own "no wrapper element"
      // comment — the shells lay out as a column, a wrapper would break it).
      'vue/no-multiple-template-root': 'off',

      // Templates here are hand-formatted dense (several short attributes
      // per line, e.g. `<a :to="..." class="..." aria-label="...">`) rather
      // than one-attribute-per-line — these rules assume the latter, and
      // html-indent's own errors are a downstream artifact of that
      // disagreement, not independent formatting slips.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      'vue/first-attribute-linebreak': 'off',

      // nuxt.config.ts's key order is grouped by what each section is for
      // (server-only config, then head/app, then routeRules, then modules
      // and their own config next to them), not Nuxt's generic recommended
      // order — the autofix for this rule reshuffled it into something
      // harder to follow and, in one spot, mangled onto a single line.
      'nuxt/nuxt-config-keys-order': 'off',
    },
  },
  {
    files: ['tests/**'],
    rules: {
      // Test doubles/mocks legitimately need loose typing.
      '@typescript-eslint/no-explicit-any': 'off',
      // Every composable/component test imports the subject at the bottom,
      // after the tests that use it — vitest doesn't run Nuxt's auto-import
      // transform for the test file itself, so the import has to be
      // explicit, and every file's own comment documents doing it this way.
      'import/first': 'off',
    },
  },
)
