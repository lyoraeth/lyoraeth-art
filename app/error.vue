<script setup lang="ts">
import type { NuxtError } from '#app'

const { t } = useI18n()
const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

const code    = computed(() => String(props.error.statusCode ?? '?'))
const message = computed(() => is404.value ? t('error.404_message') : t('error.5xx_message'))
const catSrc  = computed(() => is404.value ? '/404-cat.webp' : '/500-cat.webp')
const catAlt  = computed(() => is404.value ? t('error.404_cat_alt') : t('error.5xx_cat_alt'))

useSeoMeta({ title: computed(() => `${code.value} — lyoraeth`) })

// Error pages must never be indexed
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

// error.vue replaces app.vue as the root component on an error page, so
// app.vue's own onMounted (the e2e hydration-ready signal) never fires here
onMounted(() => {
  document.documentElement.dataset.hydrated = 'true'
})
</script>

<template>
  <NuxtLayout name="redesign">
    <div class="flex flex-col items-center gap-hero-heading-gap py-section-gap">
      <img :src="catSrc" :alt="catAlt" width="180" height="180" loading="eager" class="error-cat">

      <div class="flex flex-row items-center justify-center gap-hero-heading-gap">
        <span class="type-display-3xl text-text-secondary">{{ code }}</span>
        <p class="type-body-lg text-text-primary">{{ message }}</p>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* Framed like a card cover rather than dropped in bare — small and off to
     the side of the actual message, so it reads as a wink rather than the
     point of the page. */
  .error-cat {
    width: 100%;
    max-width: 180px;
    height: auto;
    border-radius: var(--radius-3xl);
    outline: 1px solid var(--color-border-default);
  }
}
</style>
