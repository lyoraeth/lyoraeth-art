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
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => t('seo.og_title'),
  twitterCard: 'summary_large_image',
  twitterImage: 'https://lyoraeth.art/og/home',
})

useHead({
  // @nuxtjs/i18n types htmlAttrs as a plain Record<string, string>
  // (MetaAttrs), missing several of the templated index signatures
  // (data-*, xmlns:*, ...) unhead's own HtmlAttr declares — a genuine type
  // mismatch between the two packages, not anything wrong at the call site;
  // the values themselves (lang/dir) are exactly what useHead expects at
  // runtime, so a narrow escape hatch here beats reconstructing unhead's
  // full attribute type by hand.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  htmlAttrs: (() => i18nHead.value.htmlAttrs) as any,
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
        // tm()'s generic return type collapses to Record<string, any> without
        // a locale-message schema declared — item's real shape isn't
        // recoverable here (same gap as the htmlAttrs cast above).
        knowsLanguage: (tm('schema.knows_language') as unknown[])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((name: any) => ({ '@type': 'Language', name: rt(name) })),
        sameAs: [
          'https://github.com/lyoraeth',
          'https://t.me/lyoraeth_art',
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        knowsAbout: (tm('schema.knows_about') as unknown[]).map((item: any) => rt(item)),
      })),
    },
  ],
})

// e2e's own hydration-ready signal. `app._instance.isMounted` (Vue's private
// internal flag) turned out to be unreliable across builds — it never flips
// in the production Docker image despite the page being fully rendered and
// interactive, for reasons tied to how that specific build gets optimized.
// A plain DOM attribute we set ourselves doesn't depend on Vue internals at
// all, so it can't drift the same way.
onMounted(() => {
  document.documentElement.dataset.hydrated = 'true'
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
