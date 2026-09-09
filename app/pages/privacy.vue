<script setup lang="ts">
import enMd from '~/assets/content/privacy.en.md?raw'
import ruMd from '~/assets/content/privacy.ru.md?raw'

definePageMeta({ layout: 'redesign' })

const { t, locale } = useI18n()

useSeoMeta({
  title:         computed(() => `${t('privacy.title')} — lyoraeth`),
  description:   computed(() => t('privacy.description')),
  ogTitle:       computed(() => t('privacy.title')),
  ogDescription: computed(() => t('privacy.description')),
})

// Shared with the blog post body, not a separate marked() call: the plain
// version this page used to call directly skipped the h2/h3 id-stamping
// useMarkdown sets up, so a 15-heading document like this one had no
// linkable sections at all.
const { renderPost } = useMarkdown()
const html = computed(() => renderPost(locale.value === 'ru' ? ruMd : enMd))
</script>

<template>
  <LegalArticle :html="html" />
</template>
