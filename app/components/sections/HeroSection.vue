<script setup lang="ts">
import type { SiteSettings } from '../../../server/api/settings.get'

const { t, tm, rt } = useI18n()
const ready = ref(false)

// Explicit shared key — ContactSection uses the same one, so both sections
// share a single request and hydration payload entry per SSR render.
const { data: settings } = await useFetch<SiteSettings>('/api/settings', { key: 'site-settings' })

onMounted(() => requestAnimationFrame(() => { ready.value = true }))

const meta = computed(() =>
  (tm('hero.meta') as any[]).map(item => ({
    label: rt(item.label),
    value: rt(item.value),
  }))
)
</script>

<template>
  <header :class="['hero', { 'hero-ready': ready }]">
    <div class="hero-content">
      <p class="eyebrow hero-eyebrow lo d1">{{ t('hero.eyebrow') }}</p>

      <h1 class="hero-name lo d2">
        {{ t('hero.name') }}
        <i18n-t keypath="hero.subtitle" tag="span" class="hero-sub lo d3">
          <template #em><em>{{ t('hero.subtitle_em') }}</em></template>
          <template #acc><span class="hero-sub-acc">{{ t('hero.subtitle_acc') }}</span></template>
        </i18n-t>
      </h1>

      <div class="hero-foot lo d4">
        <div v-for="item in meta" :key="item.label" class="hero-meta">
          <span class="eyebrow">{{ item.label }}</span>
          <b>{{ item.value }}</b>
        </div>
      </div>
    </div>

    <figure class="hero-portrait lo d3">
      <div class="hero-portrait-frame">
        <SanityPicture
          :src="settings?.heroPortraitUrl"
          :alt="t('hero.name')"
          class="hero-portrait-img"
          loading="eager"
          fetchpriority="high"
          :width="800"
        >
          <template #placeholder>
            <img src="/hero-portrait.png" class="hero-portrait-img" fetchpriority="high" :alt="t('hero.name')" @error="(e) => (e.target as HTMLElement).style.display = 'none'" />
          </template>
        </SanityPicture>
      </div>
      <figcaption class="hero-portrait-caption">
        <span class="eyebrow fig-label">{{ t('hero.fig_label') }}</span>
        <span class="fig-text">{{ t('hero.fig_caption') }}</span>
      </figcaption>
    </figure>

    <p class="scroll-cue eyebrow lo d4">{{ t('hero.scroll') }}</p>
  </header>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  padding: 5.625rem 0 3.75rem;
  position: relative;
}

@media (min-width: 64em) {
  .hero {
    grid-template-columns: 1.15fr 0.85fr;
    gap: clamp(2rem, 5vw, 4.5rem);
  }
}

.hero-content {
  min-width: 0;
}

.hero-eyebrow {
  margin-bottom: 1.875rem;
}

/* ── Portrait — a figure with a hairline frame, an inner gap (photo inset,
   radii kept concentric with the frame), and a mono caption underneath.
   Intentionally not a card (cards here are clickable teasers) and not a
   mock-browser frame. Photo comes from Sanity site settings, with the
   bundled static file as fallback while it's unset. */
.hero-portrait {
  display: none;
}
@media (min-width: 64em) {
  .hero-portrait {
    display: block;
    margin: 0;
    width: 100%;
    max-width: 22rem;
    justify-self: end;
  }
}
.hero-portrait-frame {
  padding: 0.375rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card);
}
/* :deep() because the class lands on SanityPicture's inner <img>, which never
   receives this component's scope attribute; same rule also covers the static
   placeholder <img> in the slot. */
.hero-portrait-frame :deep(.hero-portrait-img) {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  max-height: 30rem;
  object-fit: cover;
  object-position: center top;
  /* concentric with the frame: outer radius − (padding + border) */
  border-radius: calc(var(--radius-card) - 0.375rem - 1px);
}
.hero-portrait-caption {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0 0.4375rem;
}
.fig-label {
  color: var(--ember);
  flex-shrink: 0;
}
.fig-text {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.02em;
  color: var(--faint);
}

.hero-name {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-size: clamp(2.125rem, 0.125rem + 6.6vw, 5.75rem);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: -0.03em;
  margin-bottom: 1.75rem;
}

.hero-sub {
  font-family: 'Onest', sans-serif;
  display: block;
  color: var(--mist);
  font-weight: 400;
  font-size: clamp(1.25rem, 0.5rem + 2.2vw, 2.125rem);
  letter-spacing: -0.02em;
  margin-top: 1.625rem;
  max-width: 21ch;
  line-height: 1.18;
}
.hero-sub em {
  color: var(--ink);
  font-style: normal;
  font-weight: 500;
}
.hero-sub-acc {
  color: var(--ember);
  font-style: normal;
  font-weight: 500;
}

.hero-foot {
  display: flex;
  gap: 2.125rem;
  align-items: flex-end;
  margin-top: 3.375rem;
  flex-wrap: wrap;
}
.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.hero-meta b {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--ink);
}

.scroll-cue {
  position: absolute;
  bottom: 1.875rem;
  left: 0;
}
</style>
