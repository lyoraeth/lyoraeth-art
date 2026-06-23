<script setup lang="ts">
const { t, tm, rt } = useI18n()

const steps = computed(() =>
  (tm('approach.steps') as any[]).map(item => ({
    num:   rt(item.num),
    name:  rt(item.name),
    title: rt(item.title),
    desc:  rt(item.desc),
  }))
)

const { observe } = useReveal()
const headRef  = ref<HTMLElement | null>(null)
const gridRef  = ref<HTMLElement | null>(null)
onMounted(() => {
  observe(headRef.value)
  observe(gridRef.value)
})
</script>

<template>
  <section id="approach" class="section-approach">
    <div class="sec-head reveal" ref="headRef">
      <h2>{{ t('approach.title') }}</h2>
    </div>

    <div class="approach-grid reveal rv-d1" ref="gridRef">
      <div v-for="step in steps" :key="step.num" class="approach-cell">
        <div class="cell-step">
          <span class="cell-num mono">{{ step.num }}</span>
          <span class="eyebrow">{{ step.name }}</span>
        </div>
        <h4 class="cell-title">{{ step.title }}</h4>
        <p class="cell-desc">{{ step.desc }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-approach {
  padding: clamp(4.375rem, 9vw, 8.75rem) 0;
}

/* ── Grid container — gap: 1px via background bleed ── */
.approach-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--line-soft);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card-sm);
  overflow: hidden;
  position: relative;
}

/* Caustic overlay on the whole container */
.approach-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% -20%, oklch(100% 0 0 / 8%) 0%, transparent 60%),
    radial-gradient(ellipse 50% 35% at 85% 120%, oklch(65% 0.04 55 / 5%) 0%, transparent 55%);
  mix-blend-mode: screen;
  filter: url(#glass-caustic);
}

/* ── Individual cells ── */
.approach-cell {
  position: relative;
  z-index: 1;
  background: oklch(13% 0.009 235 / 60%);
  backdrop-filter: blur(12px) saturate(1.4) brightness(1.02);
  -webkit-backdrop-filter: blur(12px) saturate(1.4) brightness(1.02);
  padding: clamp(1.375rem, 2.6vw, 2.125rem);
}

.cell-step {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--faint);
  margin-bottom: 1rem;
}
.cell-num {
  color: var(--ember);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
}

.cell-title {
  font-weight: 600;
  font-size: 1.0625rem;
  letter-spacing: -0.015em;
  margin-bottom: 0.5rem;
}
.cell-desc {
  color: var(--mist);
  font-size: 0.875rem;
  line-height: 1.55;
}

/* ── Responsive ── */
@media (max-width: 42.5em) {
  .approach-grid {
    grid-template-columns: 1fr;
  }
}
</style>
