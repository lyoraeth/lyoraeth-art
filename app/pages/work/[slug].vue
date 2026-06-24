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

    <p class="work-desc">{{ loc(item.description) }}</p>

    <a
      v-if="item.url"
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      class="view-btn"
    >
      {{ t('work.view_project') }}
      <span class="btn-arrow">↗</span>
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
  line-height: 1.75;
  margin-bottom: 2.5rem;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6875rem 1.75rem;
  background: var(--ember-bg);
  border: 1px solid var(--ember-border);
  border-radius: var(--radius-tag);
  color: var(--ember);
  font-size: 0.9375rem;
  text-decoration: none;
  transition: background 0.2s;
}
.view-btn:hover { background: rgba(214, 154, 106, 0.15); background: oklch(72% 0.1 58 / 15%); }
.btn-arrow {
  display: inline-block;
  transition: transform 0.3s var(--ease-out-expo);
}
.view-btn:hover .btn-arrow { transform: translate(0.2rem, -0.2rem); }
</style>
