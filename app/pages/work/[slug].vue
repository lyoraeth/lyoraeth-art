<script setup lang="ts">
import type { WorkItem } from '../../../server/api/work.get'

const { t }      = useI18n()
const loc        = useLoc()
const localePath = useLocalePath()
const route  = useRoute()
const slug   = route.params.slug as string

const { data: item } = await useFetch<WorkItem | null>(`/api/work/${slug}`)

if (!item.value) {
  throw createError({ statusCode: 404, statusMessage: 'Work item not found' })
}

const title = computed(() => loc(item.value?.title))

const descParagraphs = computed(() =>
  (loc(item.value?.description) ?? '').split(/\n\n+/).filter(Boolean),
)

const ogImage = computed(() => item.value?.coverUrl ?? 'https://lyoraeth.art/og-image.png')

useSeoMeta({
  title:         computed(() => `${title.value} — lyoraeth`),
  ogTitle:       computed(() => title.value),
  ogDescription: computed(() => loc(item.value?.description)),
  ogImage:       ogImage,
  ogType:        'article',
  twitterCard:   'summary_large_image',
  twitterImage:  ogImage,
})
</script>

<template>
  <article class="work-page" v-if="item">
    <NuxtLink :to="localePath('/work')" class="back-link">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ t('work.title') }}
    </NuxtLink>

    <header class="work-header">
      <div class="work-meta">
        <span class="eyebrow">{{ loc(item.kicker) }}</span>
        <span v-if="item.year" class="eyebrow meta-dot-sep">{{ item.year }}</span>
      </div>

      <h1 class="work-title">{{ title }}</h1>

      <div class="work-tags">
        <span v-if="item.tagWarm" class="tag tag--warm">{{ item.tagWarm }}</span>
        <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>

    <div v-if="item.coverUrl" class="work-cover">
      <SanityPicture
        :src="item.coverUrl"
        :alt="item.coverAlt ?? title"
        loading="eager"
        :width="1100"
        :height="item.coverWidth && item.coverHeight ? Math.round(1100 * item.coverHeight / item.coverWidth) : undefined"
      />
    </div>

    <p v-for="(para, i) in descParagraphs" :key="i" class="work-desc">{{ para }}</p>

    <a
      v-if="item.showLink && item.url"
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      class="work-link"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 13L13 3M13 3H7M13 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ t('work.view_project') }}
    </a>
  </article>
</template>

<style scoped>
.work-page {
  max-width: 52rem;
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 8rem) var(--page-px, 1.5rem) clamp(4rem, 8vw, 8rem);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--faint);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 2.5rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--snow); }
.back-link svg { width: 1rem; height: 1rem; }

.work-header { margin-bottom: 2rem; }

.work-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: var(--faint);
}
.meta-dot-sep::before {
  content: '·';
  margin-right: 0.75rem;
}

.work-title {
  font-size: clamp(1.75rem, 1.25rem + 2.5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.work-tags {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  color: var(--mist);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: rgba(255, 255, 255, 0.02);
  background: oklch(100% 0 0 / 2%);
}
.tag--warm {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

.work-cover {
  margin: 0 0 2.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--line-soft);
}
.work-cover img {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: auto 16/9;
}

.work-desc {
  font-size: 1.0625rem;
  color: var(--ink);
  line-height: 1.9;
  margin-bottom: 1.25rem;
  hyphens: auto;
  font-kerning: normal;
  font-feature-settings: 'kern' 1, 'liga' 1;
}
.work-desc:last-of-type {
  margin-bottom: 2.5rem;
}

/* lead paragraph — brighter, slightly larger, sets the tone */
.work-desc:first-of-type {
  font-size: 1.125rem;
  color: var(--snow);
  line-height: 1.8;
  margin-bottom: 1.75rem;
}

/* ember accent on the opening letter — inline, same baseline */
.work-desc:first-of-type::first-letter {
  font-size: 1.2em;
  font-weight: 700;
  color: var(--ember);
}

/* indent subsequent paragraphs — classic typographic rhythm */
.work-desc + .work-desc {
  text-indent: 1.5em;
}

.work-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--faint);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  text-decoration: none;
  transition: color 0.2s;
  margin-top: 0.5rem;
}
.work-link svg { width: 0.75rem; height: 0.75rem; flex-shrink: 0; }
.work-link:hover { color: var(--ember); }
</style>
