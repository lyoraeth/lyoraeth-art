<script setup lang="ts">
const { t, tm, rt } = useI18n()

interface Chip { name: string; tip: string; warm?: boolean }

function resolveChips(key: string): Chip[] {
  return (tm(key) as any[]).map(item => ({
    name: rt(item.name),
    tip:  rt(item.tip),
    warm: item.warm ?? false,
  }))
}

const daily = computed(() => resolveChips('stack.chips.daily'))
const also  = computed(() => resolveChips('stack.chips.also'))

const { observe } = useReveal()
const stackRef = ref<HTMLElement | null>(null)

const openChip = ref<string | null>(null)

function toggleChip(name: string) {
  openChip.value = openChip.value === name ? null : name
}

function onDocClick(e: MouseEvent) {
  if (!(e.target as Element).closest('.chip')) openChip.value = null
}

onMounted(() => {
  observe(stackRef.value)
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <section id="stack" class="section-stack">
    <div class="stack reveal" ref="stackRef">

      <div class="stack-lbl">
        <span class="eyebrow">{{ t('stack.title') }}</span>
        <b class="stack-lbl-b">{{ t('stack.label') }}</b>
      </div>

      <div class="stack-rows">
        <div class="stack-row">
          <span class="stack-k eyebrow">{{ t('stack.daily') }}</span>
          <div class="chips">
            <span
              v-for="chip in daily"
              :key="chip.name"
              role="button"
              class="chip"
              :class="{ 'chip--love': chip.warm, 'chip--open': openChip === chip.name }"
              tabindex="0"
              :aria-expanded="openChip === chip.name"
              :aria-label="`${chip.name} — ${chip.tip}`"
              @click="toggleChip(chip.name)"
              @keydown.enter.space.prevent="toggleChip(chip.name)"
            >
              {{ chip.name }}
              <span class="tip" aria-hidden="true">{{ chip.tip }}</span>
            </span>
          </div>
        </div>

        <div class="stack-row">
          <span class="stack-k eyebrow">{{ t('stack.also') }}</span>
          <div class="chips">
            <span
              v-for="chip in also"
              :key="chip.name"
              role="button"
              class="chip"
              :class="{ 'chip--open': openChip === chip.name }"
              tabindex="0"
              :aria-expanded="openChip === chip.name"
              :aria-label="`${chip.name} — ${chip.tip}`"
              @click="toggleChip(chip.name)"
              @keydown.enter.space.prevent="toggleChip(chip.name)"
            >
              {{ chip.name }}
              <span class="tip" aria-hidden="true">{{ chip.tip }}</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.section-stack {
  padding: clamp(4.375rem, 9vw, 8.75rem) 0;
}

/* ── Main grid ─────────────────────────────────────────────────────────────── */
.stack {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: clamp(1.25rem, 4vw, 4rem);
  align-items: start;
  border-top:    1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  padding: 2.125rem 0;
}

/* ── Label column ──────────────────────────────────────────────────────────── */
.stack-lbl {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.stack-lbl-b {
  font-weight: 600;
  font-size: 1.0625rem;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* ── Rows ──────────────────────────────────────────────────────────────────── */
.stack-rows {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}
.stack-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}
.stack-k {
  width: 4.625rem;
  flex: none;
  letter-spacing: 0.12em;
}
.chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ── Chip ──────────────────────────────────────────────────────────────────── */
.chip {
  position: relative;
  display: inline-block;
  font-family: 'Onest', system-ui, sans-serif;
  font-size: 0.875rem;
  color: var(--mist);
  padding: 0.3125rem 0.75rem;
  border-radius: var(--radius-chip);
  border: 1px solid var(--line-soft);
  background: oklch(100% 0 0 / 2%);
  cursor: default;
  transition:
    color       0.25s var(--ease-silk),
    border-color 0.25s var(--ease-silk),
    transform    0.2s  var(--ease-out-expo);
  user-select: none;
}
.chip:hover,
.chip:focus-visible,
.chip--open {
  color: var(--ink);
  border-color: var(--line);
  transform: translateY(-0.125rem);
}
.chip:focus-visible {
  outline: 2px solid oklch(72% 0.1 58 / 70%);
  outline-offset: 2px;
}
.chip--love {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

/* ── Tooltip ───────────────────────────────────────────────────────────────── */
.tip {
  position: absolute;
  bottom: calc(100% + 0.5625rem);
  left: 50%;
  transform: translateX(-50%) translateY(0.3125rem) scale(0.97);
  white-space: nowrap;
  font-size: 0.71875rem;
  color: var(--ink);
  padding: 0.4375rem 0.6875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--line);
  background: oklch(13% 0.009 235 / 92%);
  backdrop-filter: blur(10px);
  box-shadow: 0 0.625rem 1.5rem -0.75rem oklch(0% 0 0 / 90%);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity   0.2s var(--ease-silk),
    transform 0.2s var(--ease-out-expo);
  z-index: 8;
}
.tip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 0.3125rem solid transparent;
  border-top-color: oklch(13% 0.009 235 / 92%);
}
.chip:hover .tip,
.chip:focus-visible .tip,
.chip--open .tip {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 42.5em) {
  .stack {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .stack-k {
    width: auto;
  }
}
</style>
