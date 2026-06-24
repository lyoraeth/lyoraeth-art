<script setup lang="ts">
import { marked } from 'marked'
import enMd from '~/assets/content/privacy.en.md?raw'
import ruMd from '~/assets/content/privacy.ru.md?raw'

const { t, locale } = useI18n()
const localePath = useLocalePath()

useSeoMeta({ title: computed(() => `${t('privacy.title')} — lyoraeth`) })

const html = computed(() => marked(locale.value === 'ru' ? ruMd : enMd) as string)
</script>

<template>
  <div class="doc-page">
    <NuxtLink :to="localePath('/')" class="back-link">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ t('error.go_home') }}
    </NuxtLink>
    <article class="doc-prose" v-html="html" />
  </div>
</template>
