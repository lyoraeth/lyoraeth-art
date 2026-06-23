<script setup lang="ts">
const { t, tm, rt } = useI18n()
const ready = ref(false)

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

    <p class="scroll-cue eyebrow lo d4">{{ t('hero.scroll') }}</p>
  </header>
</template>

<style scoped>
.hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5.625rem 0 3.75rem;
  position: relative;
}

.hero-eyebrow {
  margin-bottom: 1.875rem;
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
