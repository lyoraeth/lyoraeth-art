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
    <!-- SVG glass filter — referenced by url(#glass-caustic) in any component -->
    <svg width="0" height="0" aria-hidden="true" style="position:absolute;pointer-events:none">
      <defs>
        <filter id="glass-caustic" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="linearRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.38 0.28" numOctaves="2" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <a href="#main-content" class="skip-link">{{ t('a11y.skip') }}</a>
    <NuxtRouteAnnouncer />
    <Grain />
    <SiteNav />
    <MobileDock />
    <SiteCurtain />
    <main id="main-content" class="page">
      <Stage />
      <NuxtPage />
      <SiteFooter />
    </main>
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
  overflow-x: clip;
  line-height: 1.5;
}


.page {
  position: relative;
  z-index: 1;
  background: var(--void);
  min-height: 100svh;
}
</style>
