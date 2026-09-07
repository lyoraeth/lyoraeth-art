<script setup lang="ts">
import type { WorkItem } from '../../../server/api/work.get'

definePageMeta({ layout: 'redesign' })

const { t, locale } = useI18n()
const plural = usePlural()

useSeoMeta({
  title:         computed(() => `${t('work.title')} — lyoraeth`),
  description:   computed(() => t('work.seo_description')),
  ogTitle:       computed(() => `${t('work.title')} — lyoraeth`),
  ogDescription: computed(() => t('work.seo_description')),
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${t('work.title')} — lyoraeth`,
      url: `https://lyoraeth.art${locale.value === 'ru' ? '/ru' : ''}/work`,
    })),
  }],
})

const { data: allWork } = await useFetch('/api/work', {
  query: { limit: 0 },
  default: () => [] as WorkItem[],
})

/* No filters here — the list is short enough that sorting by date already
   does the whole job a filter would. Grouped by year (undated items fall
   into one trailing group) rather than a flat sorted list, since the year
   is the one thing worth breaking the grid up by. */
const grouped = computed(() => {
  const map = new Map<number | 'other', WorkItem[]>()
  for (const item of allWork.value) {
    const key = item.year ?? 'other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === 'other') return 1
    if (b === 'other') return -1
    return b - a
  })
})
</script>

<template>
  <div class="flex flex-col gap-y-section-gap py-section-padding-y">
    <header class="flex items-baseline gap-5">
      <h1 class="type-display-2xl text-text-primary">{{ t('work.title') }}</h1>
      <span class="type-ui text-text-secondary">
        {{ t(`work.count_${plural(allWork.length)}`, { n: allWork.length }) }}
      </span>
    </header>

    <!-- Full-width grid, no filter column to share it with — same card and
         the same column split the homepage section uses. -->
    <div v-for="[year, items] in grouped" :key="String(year)" class="flex flex-col gap-y-section-header-gap">
      <div class="year-divider">
        <span class="type-ui text-text-secondary">{{ year === 'other' ? '—' : year }}</span>
        <div class="year-divider__line" />
      </div>

      <div class="layout-grid gap-grid-gap auto-rows-fr">
        <WorkCard
          v-for="item in items"
          :key="item._id"
          :item="item"
          class="col-span-4 xl:col-span-6 2xl:col-span-3"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .year-divider {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 4);
  }

  .year-divider__line {
    flex: 1;
    height: 1px;
    background-color: var(--color-border-default);
  }
}
</style>
