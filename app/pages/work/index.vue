<script setup lang="ts">
import type { WorkItem } from '../../server/api/work.get'

const { t, locale } = useI18n()

useSeoMeta({ title: 'Work — lyoraeth' })

const { data: allWork } = await useFetch('/api/work', {
  query: { limit: 0 },
  default: () => [] as WorkItem[],
})

const loc = (obj: { en: string; ru: string } | null | undefined) =>
  obj ? (locale.value === 'ru' && obj.ru ? obj.ru : obj.en) : ''

/* Group by year (undefined → 'Other') */
const grouped = computed(() => {
  const items = allWork.value ?? []
  const map = new Map<number | 'Other', WorkItem[]>()
  for (const item of items) {
    const key = item.year ?? 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  // Sort groups: years descending, 'Other' last
  return [...map.entries()].sort(([a], [b]) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return (b as number) - (a as number)
  })
})
</script>

<template>
  <div class="work-page">
    <header class="page-head">
      <h1>{{ t('work.title') }}</h1>
      <span class="eyebrow">{{ t('work.projects', { n: (allWork ?? []).length }) }}</span>
    </header>

    <div v-for="[year, items] in grouped" :key="String(year)" class="year-group">
      <div class="year-label">
        <span class="eyebrow">{{ year }}</span>
        <div class="year-line"></div>
      </div>

      <div class="work-grid">
        <NuxtLink
          v-for="item in items"
          :key="item._id"
          class="work-compact glass-card"
          :to="`/work/${item.slug}`"
        >
          <div class="wc-top">
            <span class="eyebrow wc-kicker">{{ loc(item.kicker) }}</span>
            <span v-if="item.tagWarm" class="tag tag--warm">{{ item.tagWarm }}</span>
          </div>
          <h2 class="wc-title">{{ loc(item.title) }}</h2>
          <p class="wc-desc">{{ loc(item.description) }}</p>
          <div class="wc-tags">
            <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <span class="wc-link">
            {{ t('work.view_project') }} <span class="wc-arrow">→</span>
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.work-page {
  max-width: var(--content-width, 72rem);
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 9rem) var(--page-px, 1.5rem) clamp(4rem, 8vw, 8rem);
}

/* ── Header ── */
.page-head {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  margin-bottom: clamp(3rem, 6vw, 5rem);
}
.page-head h1 {
  font-size: clamp(2rem, 2rem + 2vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}
.page-head .eyebrow { color: var(--faint); }

/* ── Year group ── */
.year-group { margin-bottom: clamp(2.5rem, 5vw, 4rem); }

.year-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.year-label .eyebrow { flex-shrink: 0; color: var(--ember); }
.year-line {
  flex: 1;
  height: 1px;
  background: var(--line-soft);
}

/* ── Grid ── */
.work-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* ── Compact card ── */
.work-compact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: var(--radius-card-sm);
  text-decoration: none;
  color: inherit;
  transition:
    opacity      var(--duration-reveal) var(--ease-out-expo),
    transform    var(--duration-reveal) var(--ease-out-expo),
    border-color 0.3s var(--ease-silk);
}
.work-compact:hover { border-color: oklch(72% 0.1 58 / 30%); }

.wc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.wc-kicker { color: var(--faint); }

.wc-title {
  font-size: clamp(1.0625rem, 0.875rem + 0.5vw, 1.3125rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.wc-desc {
  font-size: 0.875rem;
  color: var(--mist);
  line-height: 1.6;
  flex: 1;
}
.wc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  color: var(--mist);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: oklch(100% 0 0 / 2%);
}
.tag--warm {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}
.wc-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--ember);
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}
.wc-arrow {
  display: inline-block;
  transition: transform 0.3s var(--ease-out-expo);
}
.work-compact:hover .wc-arrow { transform: translate(0.2rem, -0.2rem); }

/* ── Responsive ── */
@media (max-width: 40rem) {
  .work-grid { grid-template-columns: 1fr; }
}
</style>
