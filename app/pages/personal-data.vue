<script setup lang="ts">
import { marked } from 'marked'
import ruMd from '~/assets/content/personal-data.ru.md?raw'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

if (locale.value !== 'ru') {
  await navigateTo(localePath('/privacy'), { redirectCode: 301 })
}

watch(locale, (lang) => {
  if (lang !== 'ru') navigateTo(localePath('/privacy'))
})

useSeoMeta({ title: computed(() => `${t('personal_data.title')} — lyoraeth`) })

const html = computed(() => marked(ruMd) as string)

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    window.close()
    navigateTo(localePath('/'))
  }
}
</script>

<template>
  <div class="doc-page">
    <button class="back-link" @click="handleBack">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ t('error.go_home') }}
    </button>
    <article class="doc-prose" v-html="html" />
  </div>
</template>
