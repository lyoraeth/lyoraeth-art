<script setup lang="ts">
import type { ProjectItem } from '../../../server/api/project.get'

const { t } = useI18n()
const localePath = useLocalePath()
const plural = usePlural()

// the whole list: the count in the header speaks for all of them, the page
// shows the first few
const { data: items } = await useFetch<ProjectItem[]>('/api/project', {
  query: { limit: 0 },
  key: 'projects-all',
  default: () => [] as ProjectItem[],
})

const SHOWN = 3

const shown = computed(() => items.value.slice(0, SHOWN))
const total = computed(() => items.value.length)
</script>

<template>
  <!-- v-if on the section itself, not a wrapper: the homepage is a stack of
       sections and an empty catalog must leave no empty gap in it -->
  <section
    v-if="total"
    id="projects"
    class="flex flex-col gap-y-section-header-gap py-section-padding-y"
    aria-labelledby="projects-title"
  >
    <div class="section-header">
      <h2 id="projects-title" class="section-header__title type-display-xl text-text-primary">
        {{ t('projects.title') }}
      </h2>
      <span class="section-header__count type-ui text-text-secondary">
        {{ t(`projects.count_${plural(total)}`, { n: total }) }}
      </span>
      <NuxtLink
        :to="localePath('/projects')"
        class="section-header__action h-10 w-40 inline-flex justify-center items-center rounded-full type-ui text-text-inverse bg-fill-strong hover:bg-accent-strong-hover active:bg-accent-default"
      >
        {{ t('projects.see_all') }}
      </NuxtLink>
    </div>

    <div class="flex flex-col gap-y-section-header-gap">
      <ProjectShowcase v-for="item in shown" :key="item._id" :item="item" />
    </div>
  </section>
</template>
