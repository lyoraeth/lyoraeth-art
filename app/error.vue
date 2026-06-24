<script setup lang="ts">
import type { NuxtError } from '#app'

const { t } = useI18n()
const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error.statusCode === 404)

const code    = computed(() => String(props.error.statusCode ?? '?'))
const title   = computed(() => is404.value ? t('error.404_title')   : t('error.5xx_title'))
const message = computed(() => is404.value ? t('error.404_message') : t('error.5xx_message'))

useSeoMeta({ title: computed(() => `${code.value} — lyoraeth`) })

function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <!-- Ambient blobs — same pattern as main layout -->
    <div class="blob blob-a" aria-hidden="true"></div>
    <div class="blob blob-b" aria-hidden="true"></div>

    <main class="error-wrap">
      <div class="error-code mono">{{ code }}</div>

      <div class="error-divider"></div>

      <div class="error-body">
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
  background: var(--void);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem var(--page-px, 1.5rem);
  position: relative;
  overflow: hidden;
}

/* ── Ambient blobs ── */
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.35;
  animation: blob-drift 18s ease-in-out infinite alternate;
}
.blob-a {
  width: 40vw; height: 40vw;
  top: -10%; left: -5%;
  background: var(--teal);
  animation-duration: 20s;
}
.blob-b {
  width: 32vw; height: 32vw;
  bottom: -8%; right: -4%;
  background: var(--indigo);
  animation-duration: 24s;
  animation-direction: alternate-reverse;
}
@keyframes blob-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(3%, 4%) scale(1.06); }
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
