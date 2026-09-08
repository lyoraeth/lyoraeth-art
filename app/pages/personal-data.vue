<script setup lang="ts">
import { marked } from 'marked'
import ruMd from '~/assets/content/personal-data.ru.md?raw'

definePageMeta({ layout: 'redesign' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

if (locale.value !== 'ru') {
  await navigateTo(localePath('/privacy'), { redirectCode: 301 })
}

watch(locale, (lang) => {
  if (lang !== 'ru') navigateTo(localePath('/privacy'))
})

useSeoMeta({
  title:         computed(() => `${t('personal_data.title')} — lyoraeth`),
  description:   computed(() => t('personal_data.description')),
  ogTitle:       computed(() => t('personal_data.title')),
  ogDescription: computed(() => t('personal_data.description')),
})

const html = computed(() => marked(ruMd) as string)
</script>

<template>
  <LegalArticle :html="html" />
</template>
