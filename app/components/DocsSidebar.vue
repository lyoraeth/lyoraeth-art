<script setup lang="ts">
import type { DocsIndexPayload } from '#shared/docs'
import type { DocsSearchResult } from '../composables/useDocsSearch'

/**
 * The docs' left column: a search field over page titles and headings, and the
 * section tree from the repo's SUMMARY.md. While a query is typed, the results
 * take the tree's place — same column, so there's one thing to look at.
 */
const props = defineProps<{
  index:      DocsIndexPayload
  slug:       string
  currentKey: string
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const inputId = useId()

const ru = computed(() => locale.value === 'ru')
const docsBase = computed(() => `/projects/${props.slug}/docs`)

/** The README entry stays in the tree but leads to the project's landing page
 *  (a GitHub README is HTML with relative images — the landing page is where
 *  that content lives), so it never counts as the current docs page. */
const sections = computed(() =>
  props.index.sections.map(section => ({
    heading: (ru.value && section.heading.ru) || section.heading.en,
    pages: section.pages.map(page => ({
      key:     page.key,
      // the landing entry is the site's own page, not the repo's README: the
      // repo's wording for it ("About (README)") is not ours to show
      title:   page.landing ? t('docs.about') : (ru.value && page.title.ru) || page.title.en,
      landing: page.landing,
      to:      localePath(page.landing ? `/projects/${props.slug}` : `${docsBase.value}/${page.key}`),
    })),
  })),
)

const query = ref('')
const { search, minQueryLength } = useDocsSearch(() => props.index, () => locale.value)
const searching = computed(() => query.value.trim().length >= minQueryLength)
const results = computed(() => search(query.value))

function resultTo(result: DocsSearchResult) {
  return localePath(`${docsBase.value}/${result.pageKey}`) + (result.hash ?? '')
}

/** What a result says about where it is: the heading's page, or the page's section. */
function resultMeta(result: DocsSearchResult) {
  return [result.section, result.heading ? result.title : null].filter(Boolean).join(' › ')
}

function open(result: DocsSearchResult) {
  query.value = ''
  return navigateTo(resultTo(result))
}

function submit() {
  const first = results.value[0]
  if (first) open(first)
}
</script>

<template>
  <div class="docs-sidebar">
    <!-- the header search's field, so the two read as one control -->
    <form
      role="search"
      class="interactive flex h-10 w-full items-center gap-2.5 rounded-full px-3 hover:bg-surface-hover-strong focus-within:bg-surface-hover-strong focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-border-input"
      @submit.prevent="submit"
    >
      <button
        type="submit"
        :aria-label="t('search.submit')"
        class="interactive flex shrink-0 cursor-pointer items-center justify-center text-icon-default hover:text-text-secondary active:text-accent-strong"
      >
        <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M12.19 7.238a4.952 4.952 0 0 0-8.48-3.546A4.95 4.95 0 0 0 2.285 7.24a4.953 4.953 0 0 0 9.906-.002m2.287 0a7.2 7.2 0 0 1-1.379 4.244l2.567 2.567a1.144 1.144 0 1 1-1.616 1.616l-2.567-2.567a7.2 7.2 0 0 1-4.244 1.379 7.239 7.239 0 1 1 7.239-7.239"
          />
        </svg>
      </button>
      <label class="sr-only" :for="inputId">{{ t('docs.search_label') }}</label>
      <input
        :id="inputId"
        v-model="query"
        type="search"
        :placeholder="t('docs.search_placeholder')"
        autocomplete="off"
        class="w-full bg-transparent text-ui placeholder:text-text-secondary focus:outline-none"
        @keydown.esc="query = ''"
      >
    </form>

    <div v-if="searching" class="docs-results" aria-live="polite">
      <ul v-if="results.length" class="docs-results__list">
        <li v-for="result in results" :key="result.key">
          <NuxtLink :to="resultTo(result)" class="docs-results__link" @click="query = ''">
            <span class="type-text">{{ result.heading ?? result.title }}</span>
            <span class="docs-results__meta type-ui">{{ resultMeta(result) }}</span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="docs-results__empty type-ui">{{ t('docs.no_results') }}</p>
    </div>

    <nav v-else :aria-label="t('docs.nav_label')">
      <div v-for="(section, i) in sections" :key="i" class="docs-nav__section">
        <p v-if="section.heading" class="docs-nav__heading type-ui">{{ section.heading }}</p>
        <ul class="docs-nav__list">
          <li v-for="page in section.pages" :key="page.key">
            <NuxtLink
              :to="page.to"
              class="docs-nav__link"
              :aria-current="!page.landing && page.key === currentKey ? 'page' : undefined"
            >{{ page.title }}</NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .docs-sidebar {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 6);
  }

  .docs-nav__section + .docs-nav__section { margin-top: calc(var(--spacing) * 6); }

  .docs-nav__heading {
    margin-bottom: calc(var(--spacing) * 2);
    padding-inline: calc(var(--spacing) * 2);
    color: var(--color-text-secondary);
  }

  .docs-nav__list,
  .docs-results__list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 0.5);
    list-style: none;
  }

  .docs-nav__link {
    display: block;
    padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 2);
    border-radius: var(--radius-2xl);
    font-size: var(--text-ui);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: color var(--duration-hover) var(--ease-out),
                background-color var(--duration-hover) var(--ease-out);
  }
  .docs-nav__link:hover { background-color: var(--color-surface-hover); }

  /* The page you are on — a deliberate position, not an ambient hint like the
     TOC's moving highlight, so it gets the accent and keeps the fill. */
  .docs-nav__link[aria-current='page'] {
    color: var(--color-accent-strong);
    background-color: var(--color-surface-hover);
  }

  .docs-results__link {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 0.5);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 2);
    border-radius: var(--radius-2xl);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: background-color var(--duration-hover) var(--ease-out);
  }
  .docs-results__link:hover { background-color: var(--color-surface-hover); }

  .docs-results__meta { color: var(--color-text-secondary); }

  .docs-results__empty {
    padding-inline: calc(var(--spacing) * 2);
    color: var(--color-text-secondary);
  }
}
</style>
