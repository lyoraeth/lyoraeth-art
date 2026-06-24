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

<style>
.doc-page {
  max-width: 44rem;
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 8rem) var(--page-px, 1.5rem) clamp(4rem, 8vw, 8rem);
}
.doc-page .back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--faint);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 2.5rem;
  transition: color 0.2s;
}
.doc-page .back-link:hover { color: var(--snow); }
.doc-page .back-link svg { width: 1rem; height: 1rem; }

.doc-prose { color: var(--ink); line-height: 1.75; font-size: 1rem; }

.doc-prose h1 {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-size: clamp(1.75rem, 1.25rem + 2vw, 2.5rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.1;
  color: var(--snow);
  margin: 0 0 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--line-soft);
}
.doc-prose h2 {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--snow);
  margin: 2rem 0 0.5rem;
}
.doc-prose p { color: var(--mist); margin: 0 0 1rem; font-size: 0.9375rem; line-height: 1.7; }
.doc-prose p:last-child { margin-bottom: 0; }
.doc-prose p em { color: var(--faint); font-style: normal; font-family: 'JetBrains Mono', monospace; font-size: 0.6875rem; letter-spacing: 0.06em; }
.doc-prose strong { color: var(--snow); font-weight: 600; }
.doc-prose a { color: var(--ember); text-decoration: underline; text-decoration-color: rgba(214, 154, 106, 0.4); text-underline-offset: 2px; transition: text-decoration-color 0.2s; }
.doc-prose a:hover { text-decoration-color: var(--ember); }
.doc-prose ul, .doc-prose ol { margin: 0 0 1rem 1.5rem; color: var(--mist); font-size: 0.9375rem; }
.doc-prose li { margin-bottom: 0.25rem; }
.doc-prose code { font-family: 'JetBrains Mono', monospace; font-size: 0.875em; background: rgba(255,255,255,0.06); border: 1px solid var(--line-soft); border-radius: 0.25rem; padding: 0.1em 0.4em; color: var(--ember); }
.doc-prose hr { border: none; border-top: 1px solid var(--line-soft); margin: 2rem 0; }
</style>
