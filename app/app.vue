<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('seo.title'),
  description: () => t('seo.description'),
  ogTitle: () => t('seo.og_title'),
  ogDescription: () => t('seo.og_description'),
  ogType: 'website',
  twitterCard: 'summary',
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Danil Klimov',
        url: 'https://lyoraeth.art',
        jobTitle: 'Frontend Developer',
        sameAs: [
          'https://github.com/lyoraeth',
        ],
      }),
    },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <Grain />
    <SiteNav />
    <div class="page">
      <Stage />
      <NuxtPage />
    </div>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--void);
  color: var(--ink);
  font-family: 'Onest', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  line-height: 1.5;
}

.page {
  position: relative;
  z-index: 1;
  background: var(--void);
  overflow: hidden;
}
</style>
