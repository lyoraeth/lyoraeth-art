<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({ title: computed(() => `${t('privacy.title')} — lyoraeth`) })
</script>

<template>
  <main class="page privacy-page">
    <div class="privacy-inner">
      <header class="privacy-header">
        <h1 class="privacy-title">{{ t('privacy.title') }}</h1>
        <p class="privacy-updated">{{ t('privacy.updated') }}</p>
        <p class="privacy-lead">{{ t('privacy.intro') }}</p>
      </header>

      <section class="privacy-section" v-for="n in 6" :key="n">
        <h2 class="privacy-section-title">{{ t(`privacy.s${n}_title`) }}</h2>
        <p class="privacy-section-body">
          <template v-if="n === 5">
            {{ t('privacy.s5_body', { email: 'sarthriles@gmail.com' }) }}
          </template>
          <template v-else>
            {{ t(`privacy.s${n}_body`) }}
          </template>
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.privacy-page {
  min-height: 100vh;
  padding-top: clamp(5rem, 12vw, 9rem);
  padding-bottom: clamp(4rem, 10vw, 8rem);
}

.privacy-inner {
  max-width: 42rem;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 0.1538rem + 4.8718vw, 6rem);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.privacy-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--line-soft);
}

.privacy-title {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-weight: 600;
  font-size: clamp(1.75rem, 1.25rem + 2vw, 2.5rem);
  letter-spacing: -0.025em;
  line-height: 1.1;
  color: var(--ink);
}

.privacy-updated {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  color: var(--faint);
}

.privacy-lead {
  color: var(--mist);
  font-size: 1rem;
  line-height: 1.65;
  margin-top: 0.25rem;
}

.privacy-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.privacy-section-title {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.privacy-section-body {
  color: var(--mist);
  font-size: 0.9375rem;
  line-height: 1.7;
}
</style>
