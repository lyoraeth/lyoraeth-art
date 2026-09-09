<script setup lang="ts">
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

// Shared with the blog post body and privacy.vue — see privacy.vue for why
// this isn't a separate marked() call.
const { renderPost } = useMarkdown()
const html = computed(() => renderPost(ruMd))
</script>

<template>
  <LegalArticle :html="html" />
</template>
