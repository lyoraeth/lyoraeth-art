<script setup lang="ts">
import type { ProjectItem } from '../../../server/api/project.get'

definePageMeta({ layout: 'redesign' })

const { t, locale } = useI18n()
const plural = usePlural()

useSeoMeta({
  title:         computed(() => `${t('projects.title')} — lyoraeth`),
  description:   computed(() => t('projects.seo_description')),
  ogTitle:       computed(() => `${t('projects.title')} — lyoraeth`),
  ogDescription: computed(() => t('projects.seo_description')),
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${t('projects.title')} — lyoraeth`,
      url: `https://lyoraeth.art${locale.value === 'ru' ? '/ru' : ''}/projects`,
    })),
  }],
})

const { data: projects } = await useFetch('/api/project', {
  query: { limit: 0 },
  default: () => [] as ProjectItem[],
})
</script>

<template>
  <div class="flex flex-col gap-y-section-gap py-section-padding-y">
    <header class="flex items-baseline gap-5">
      <h1 class="type-display-2xl text-text-primary">{{ t('projects.title') }}</h1>
      <span class="type-ui text-text-secondary">
        {{ t(`projects.count_${plural(projects.length)}`, { n: projects.length }) }}
      </span>
    </header>

    <div class="flex flex-col gap-y-section-header-gap">
      <ProjectShowcase v-for="item in projects" :key="item._id" :item="item" />
    </div>
  </div>
</template>
