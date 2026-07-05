<script setup lang="ts">
import type { NuxtError } from '#app'

const { t } = useI18n()
const localePath = useLocalePath()
const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

const code    = computed(() => String(props.error.statusCode ?? '?'))
const title   = computed(() => is404.value ? t('error.404_title')   : t('error.5xx_title'))
const message = computed(() => is404.value ? t('error.404_message') : t('error.5xx_message'))

useSeoMeta({ title: computed(() => `${code.value} — lyoraeth`) })

// Error pages must never be indexed
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

function handleError() {
  // localePath — otherwise a RU visitor lands on the EN home after an error
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <div class="error-page">
    <main class="error-wrap">
      <div class="error-code mono">{{ code }}</div>

      <div class="error-divider"></div>

      <div class="error-body">
        <!-- The 5xx copy already blames "the tech cats" — so on a server error,
             here is one. Never on 404. -->
        <figure v-if="!is404" class="error-cat">
          <img src="/500-cat.webp" alt="A cat smirking at the server outage" width="586" height="489" loading="eager" />
        </figure>

        <h1 class="error-title">{{ title }}</h1>
        <p class="error-message">{{ message }}</p>

        <div class="error-actions">
          <button class="btn-home" @click="handleError">
            ← {{ t('error.go_home') }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  min-height: 100dvh;
  /* Static shading — same approach as Stage.vue: tints larger than the
     viewport so they read as a tint, never as shapes */
  background:
    radial-gradient(ellipse 140vw 110vh at 10% -20vh, color-mix(in srgb, var(--teal) 11%, transparent), transparent 60%),
    radial-gradient(ellipse 140vw 120vh at 95% 120vh, color-mix(in srgb, var(--indigo) 9%, transparent), transparent 60%),
    radial-gradient(120% 90% at 50% -10%, var(--deep) 0%, var(--void) 58%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--page-px, 1.5rem);
  position: relative;
  overflow: hidden;
}

/* ── Layout ── */
.error-wrap {
  display: flex;
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
  position: relative;
  z-index: 1;
  max-width: 52rem;
  width: 100%;
}

/* ── Code ── */
.error-code {
  font-size: clamp(5rem, 5rem + 8vw, 12rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.05em;
  color: var(--faint);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  user-select: none;
}

/* ── Divider ── */
.error-divider {
  width: 1px;
  height: clamp(6rem, 12vw, 10rem);
  background: var(--line-soft);
  flex-shrink: 0;
}

/* ── Body ── */
.error-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── 5xx cat — framed like the hero portrait so the joke still reads as "ours" ── */
.error-cat {
  margin: 0 0 0.5rem;
  width: 100%;
  max-width: 13rem;
  padding: 0.3125rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card-sm);
}
.error-cat img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: calc(var(--radius-card-sm) - 0.3125rem - 1px);
}

.error-title {
  font-size: clamp(1.375rem, 1rem + 1.5vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
  line-height: 1.15;
}

.error-message {
  font-size: 0.9375rem;
  color: var(--mist);
  line-height: 1.6;
  max-width: 38ch;
}

/* ── Actions ── */
.error-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.btn-home {
  padding: 0.5625rem 1.25rem;
  background: var(--ember-bg);
  border: 1px solid var(--ember-border);
  border-radius: var(--radius-tag);
  color: var(--ember);
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
}
.btn-home:hover { background: rgba(214, 154, 106, 0.15); background: oklch(72% 0.1 58 / 15%); }

/* ── Responsive ── */
@media (max-width: 40rem) {
  .error-wrap { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
  .error-divider { display: none; }
  .error-code { font-size: clamp(4rem, 20vw, 7rem); }
}
</style>
