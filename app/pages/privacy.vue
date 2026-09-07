<script setup lang="ts">
import { marked } from 'marked'
import enMd from '~/assets/content/privacy.en.md?raw'
import ruMd from '~/assets/content/privacy.ru.md?raw'

definePageMeta({ layout: 'redesign' })

const { t, locale } = useI18n()

useSeoMeta({ title: computed(() => `${t('privacy.title')} — lyoraeth`) })

const html = computed(() => marked(locale.value === 'ru' ? ruMd : enMd) as string)
</script>

<template>
  <LegalArticle :html="html" />
</template>
