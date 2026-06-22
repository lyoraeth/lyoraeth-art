<script setup lang="ts">
const { t } = useI18n()
const { $lenis } = useNuxtApp() as any

const curtainEl = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null
let held = false
const HOLD_MS = 350

function updateMargin(page: HTMLElement) {
  if (!curtainEl.value) return
  page.style.marginBottom = `${curtainEl.value.offsetHeight}px`
}

function onScroll() {
  if (!curtainEl.value) return
  const scrollY   = window.scrollY
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const threshold = maxScroll - curtainEl.value.offsetHeight

  // reset if scrolled back above the curtain zone
  if (scrollY < threshold - 40) {
    held = false
    return
  }

  if (!held && scrollY >= threshold) {
    held = true
    $lenis?.stop()
    setTimeout(() => $lenis?.start(), HOLD_MS)
  }
}

onMounted(() => {
  const page = document.querySelector('.page') as HTMLElement | null
  if (!page || !curtainEl.value) return

  ro = new ResizeObserver(() => updateMargin(page))
  ro.observe(curtainEl.value)
  updateMargin(page)

  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="curtain" ref="curtainEl" aria-label="Closing section">
    <div class="curtain-inner">
      <p class="curtain-big">
        {{ t('curtain.closing') }}<span class="curtain-acc">{{ t('curtain.closing_acc') }}</span>
      </p>

      <dl class="curtain-colophon">
        <div class="curtain-row">
          <dt class="curtain-key">{{ t('curtain.type_label') }}</dt>
          <dd>{{ t('curtain.type_value') }}</dd>
        </div>
        <div class="curtain-row">
          <dt class="curtain-key">{{ t('curtain.built_label') }}</dt>
          <dd>{{ t('curtain.built_value') }}</dd>
        </div>
        <div class="curtain-row">
          <dt class="curtain-key">{{ t('curtain.trackers_label') }}</dt>
          <dd>{{ t('curtain.trackers_value') }}</dd>
        </div>
        <div class="curtain-row">
          <dt class="curtain-key">{{ t('curtain.lang_label') }}</dt>
          <dd>{{ t('curtain.lang_value') }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.curtain {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background: var(--curtain);
  border-top: 1px solid oklch(100% 0 0 / 6%);
  border-radius: var(--radius-curtain) var(--radius-curtain) 0 0;
  box-shadow: inset 0 1.5rem 2.5rem -1.875rem oklch(0% 0 0 / 90%);
  padding:
    clamp(3.75rem, 9vw, 8.125rem)
    clamp(1.25rem, 0.1538rem + 4.8718vw, 6rem)
    clamp(3.125rem, 7vw, 5.625rem);
}

.curtain-inner {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: start;
}

/* ── Closing statement ───────────────────────────────────────────────────── */
.curtain-big {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-weight: 600;
  font-size: clamp(1.5rem, 0.625rem + 2.5vw, 2.75rem);
  letter-spacing: -0.025em;
  line-height: 1.12;
  color: var(--ink);
  max-width: 16ch;
}

.curtain-acc {
  color: var(--ember);
}

/* ── Colophon ────────────────────────────────────────────────────────────── */
.curtain-colophon {
  display: flex;
  flex-direction: column;
}

.curtain-row {
  display: flex;
  justify-content: space-between;
  gap: 0.875rem;
  padding: 0.6875rem 0;
  border-bottom: 1px solid oklch(100% 0 0 / 5%);
  font-size: 0.8125rem;
  color: var(--mist);
}

.curtain-key {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.65625rem;
  color: var(--faint);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 42.5em) {
  .curtain-inner {
    grid-template-columns: 1fr;
    gap: 1.875rem;
  }
}
</style>
