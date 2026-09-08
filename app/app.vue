<script setup lang="ts">
const { t, tm, rt } = useI18n()

// lang/dir on <html>, canonical, hreflang alternates (+ x-default),
// og:url and og:locale (+ alternates) — all derived from the i18n routing
// config, so they stay correct across locale switches and navigation.
const i18nHead = useLocaleHead()

useSeoMeta({
  title: () => t('seo.title'),
  description: () => t('seo.description'),
  ogTitle: () => t('seo.og_title'),
  ogDescription: () => t('seo.og_description'),
  ogType: 'website',
  ogImage: 'https://lyoraeth.art/og/home',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://lyoraeth.art/og/home',
})

useHead({
  htmlAttrs: () => i18nHead.value.htmlAttrs,
  meta: () => i18nHead.value.meta,
  link: () => [
    ...i18nHead.value.link,
    // RSS discovery — routes are served per-locale (see server/routes)
    { rel: 'alternate', type: 'application/rss+xml', title: 'lyoraeth — writing', href: '/rss.xml' },
    { rel: 'alternate', type: 'application/rss+xml', title: 'lyoraeth — writing (RU)', href: '/ru/rss.xml' },
  ],
  script: [
    {
      type: 'application/ld+json',
      // The one Person node for the whole site — every page's own JSON-LD
      // (BlogPosting/CreativeWork author, publisher) references it by @id
      // instead of repeating a copy, so this is the only place the fields
      // that vary by locale (name/jobTitle/description/language names) are
      // written out.
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': 'https://lyoraeth.art/#person',
        name: t('schema.name'),
        alternateName: 'lyoraeth',
        url: 'https://lyoraeth.art/',
        jobTitle: t('schema.job_title'),
        description: t('schema.description'),
        image: 'https://lyoraeth.art/face/face-1200.jpg',
        address: {
          '@type': 'PostalAddress',
          addressLocality: t('schema.address_locality'),
          addressCountry: 'RU',
        },
        knowsLanguage: (tm('schema.knows_language') as unknown[])
          .map((name: any) => ({ '@type': 'Language', name: rt(name) })),
        sameAs: [
          'https://github.com/lyoraeth',
          'https://t.me/lyoraeth_art',
        ],
        knowsAbout: (tm('schema.knows_about') as unknown[]).map((item: any) => rt(item)),
      })),
    },
  ],
})
</script>

<template>
  <!-- No wrapper element: the shells lay themselves out as a column, and every
       block in between would break that chain. -->
  <a href="#main-content" class="skip-link">{{ t('a11y.skip') }}</a>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/*
 * No manual reset here: Preflight already zeroes margin, padding and box-sizing
 * inside @layer base. Repeating it outside the layers would outrank every
 * utility, and spacing classes would silently stop working.
 */
@layer base {
  html {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
}
</style>
