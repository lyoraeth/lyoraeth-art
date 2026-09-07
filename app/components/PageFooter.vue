<script setup lang="ts">
/**
 * Footer of the light shell: closing line, colophon, and the legal bar.
 *
 * @remarks
 * Named apart from SiteFooter, which still serves the dark shell until the
 * inner pages move over.
 */
const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()

const credits = computed(() =>
  (tm('footer.credits') as unknown[]).map((item: any) => ({
    label: rt(item.label),
    value: rt(item.value),
  })),
)

/** Feeds are served per locale (see server/routes). */
const feedUrl = computed(() => (locale.value === 'ru' ? '/ru/rss.xml' : '/rss.xml'))
</script>

<template>
  <footer class="footer mt-footer-padding-top border-t border-t-border-default bg-surface-header">
    <div class="wrapper flex flex-col items-center gap-2.5">
      <div class="layout-grid gap-x-grid-gap gap-y-10 py-section-padding-y px-page-padding-x">
        <div class="flex flex-col justify-center col-span-4 md:col-span-3 xl:col-span-5">
          <p class="type-display-2xl text-text-primary">{{ t('footer.tagline') }}</p>
        </div>

        <dl class="flex flex-col gap-6 col-span-4 md:col-span-5 md:col-start-4 xl:col-span-6 xl:col-start-7">
          <div v-for="credit in credits" :key="credit.label" class="credits-row">
            <dt>{{ credit.label }}</dt>
            <dd>{{ credit.value }}</dd>
          </div>

          <div class="credits-row">
            <dt>{{ t('footer.feed_label') }}</dt>
            <dd>
              <a :href="feedUrl" class="footer-link">{{ t('footer.feed') }}</a>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="wrapper layout-grid gap-grid-gap py-footer-bar-padding-y px-page-padding-x items-center">
      <p class="type-ui text-text-secondary col-span-4 md:col-span-2 lg:col-span-3 xl:col-span-6">
        {{ t('footer.copyright') }}
      </p>

      <div class="flex flex-col md:flex-row gap-2 col-span-3 md:col-span-5 lg:col-span-4 xl:col-span-5">
        <NuxtLink :to="localePath('/privacy')" class="footer-link type-ui">
          {{ t('footer.privacy_policy') }}
        </NuxtLink>
        <!-- the separator only makes sense while the links sit on one line -->
        <span class="type-ui text-text-decorative hidden md:inline" aria-hidden="true">•</span>
        <NuxtLink :to="localePath('/personal-data')" class="footer-link type-ui">
          {{ t('footer.personal_data') }}
        </NuxtLink>
      </div>

      <a href="#main-content" class="nav-link type-ui text-nowrap w-fit col-span-1 justify-self-end">
        {{ t('footer.top') }}
      </a>
    </div>
  </footer>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* Label left, value right — the same shape as the spec list in Experience,
     but centred rather than aligned on the bottom edge. */
  .credits-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-grid-gap);
    align-items: center;
  }

  .credits-row dt {
    font-size: var(--text-ui);
    line-height: var(--text-ui--line-height);
    font-weight: var(--text-ui--font-weight);
    color: var(--color-text-secondary);
  }

  .credits-row dd {
    font-size: var(--text-text);
    line-height: var(--text-text--line-height);
    font-weight: var(--text-text--font-weight);
    color: var(--color-text-primary);
  }

  .footer-link {
    color: var(--color-accent-strong);
    transition: color var(--duration-hover) var(--ease-base);

    &:hover { color: var(--color-accent-strong-hover); }
    &:active {
      color: var(--color-accent-default);
      transition-duration: var(--duration-press);
    }
  }
}
</style>
