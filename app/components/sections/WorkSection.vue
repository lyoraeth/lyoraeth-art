<script setup lang="ts">
import type { WorkItem } from '../../../server/api/work.get'

const { t } = useI18n()
const localePath = useLocalePath()
const plural = usePlural()

// the whole list: the count in the header speaks for all of them, the grid
// shows the first few
const { data: items } = await useFetch<WorkItem[]>('/api/work', {
  query: { limit: 0 },
  key: 'work-all',
  default: () => [] as WorkItem[],
})

const CARDS = 4

const shown = computed(() => items.value.slice(0, CARDS))
const total = computed(() => items.value.length)
</script>

<template>
  <section
    id="work"
    class="flex flex-col gap-y-section-header-gap py-section-padding-y"
    aria-labelledby="work-title"
  >
    <div class="section-header">
      <h2 id="work-title" class="section-header__title type-display-xl text-text-primary">
        {{ t('work.title') }}
      </h2>
      <span class="section-header__count type-ui text-text-secondary">
        {{ t(`work.count_${plural(total)}`, { n: total }) }}
      </span>
      <NuxtLink
        :to="localePath('/work')"
        class="section-header__action h-10 w-40 inline-flex justify-center items-center rounded-full type-ui text-text-inverse bg-fill-strong hover:bg-accent-strong-hover active:bg-accent-default"
      >
        {{ t('work.see_all') }}
      </NuxtLink>
    </div>

    <!--
      auto-rows-fr levels the cards against the tallest one, both within a row
      and across rows: fractions in a container with no set height resolve to
      the largest content. The floor of 320px lives in the card.
    -->
    <div class="layout-grid gap-grid-gap auto-rows-fr">
      <WorkCard
        v-for="item in shown"
        :key="item._id"
        :item="item"
        class="col-span-4 xl:col-span-6 2xl:col-span-3"
      />
    </div>
  </section>
</template>
