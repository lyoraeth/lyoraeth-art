<script setup lang="ts">
import type { WorkItem } from '../../../server/api/work.get'

const { t } = useI18n()
const localePath = useLocalePath()
const plural = usePlural()

useSeoMeta({ title: computed(() => `${t('work.title')} — lyoraeth`) })

const { data: allWork } = await useFetch('/api/work', {
  query: { limit: 0 },
  default: () => [] as WorkItem[],
})

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
      <span class="eyebrow">{{ t(`work.projects_${plural((allWork ?? []).length)}`, { n: (allWork ?? []).length }) }}</span>
    </header>

    <div v-for="[year, items] in grouped" :key="String(year)" class="year-group">
      <div class="year-label">
        <span class="eyebrow">{{ year }}</span>
        <div class="year-line"></div>
      </div>

      <div class="work-grid">
        <WorkCompactCard
          v-for="item in items"
          :key="item._id"
          :item="item"
          :href="localePath(`/work/${item.slug}`)"
        />
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

/* ── Responsive ── */
@media (max-width: 40rem) {
  .work-grid { grid-template-columns: 1fr; }
}
</style>
