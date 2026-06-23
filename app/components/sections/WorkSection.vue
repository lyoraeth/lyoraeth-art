<script setup lang="ts">
const { t, tm, rt } = useI18n()

const items = computed(() =>
  (tm('work.items') as any[]).map(item => ({
    kicker:   rt(item.kicker),
    title:    rt(item.title),
    desc:     rt(item.desc),
    tags:     (item.tags as any[]).map((tag: any) => rt(tag)),
    tag_warm: rt(item.tag_warm),
  }))
)

/* Each card alternates layout: 0=normal, 1=reverse, 2=normal */
const reversed = [false, true, false]

/* ── Template refs ── */
const headRef = ref<HTMLElement | null>(null)
const card0   = ref<HTMLElement | null>(null)
const card1   = ref<HTMLElement | null>(null)
const card2   = ref<HTMLElement | null>(null)

/* ── Scroll reveal for section header ── */
const { observe } = useReveal()
onMounted(() => observe(headRef.value))

/* ── Glow + tilt per card ── */
const tiltReady = ref([false, false, false])

useGlowCard(card0, computed(() => tiltReady.value[0]))
useGlowCard(card1, computed(() => tiltReady.value[1]))
useGlowCard(card2, computed(() => tiltReady.value[2]))

/* Observe cards separately — enables tilt 950ms after reveal animation */
watch(
  () => [card0.value, card1.value, card2.value],
  ([c0, c1, c2]) => {
    if (!c0 && !c1 && !c2) return
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement
        el.classList.add('in')
        const i = [c0, c1, c2].indexOf(el)
        if (i >= 0) setTimeout(() => { tiltReady.value[i] = true }, 950)
        io.unobserve(el)
      })
    }, { threshold: 0.12 })
    ;[c0, c1, c2].forEach(el => { if (el) io.observe(el) })
  },
  { once: true }
)
</script>

<template>
  <section id="work" class="section-work">
    <div class="sec-head reveal" ref="headRef">
      <h2>{{ t('work.title') }}</h2>
      <span class="eyebrow">{{ t('work.subtitle') }}</span>
    </div>

    <div class="work-list">
      <!-- Card 0 — design system -->
      <article
        ref="card0"
        class="work-card glass-card reveal rv-d1"
        :class="{ 'work-card--reverse': reversed[0] }"
      >
        <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div><div class="glare-blob-2"></div></div></div>
        <div class="card-body">
          <p class="eyebrow card-kicker">{{ items[0]?.kicker }}</p>
          <h3 class="card-title">{{ items[0]?.title }}</h3>
          <p class="card-desc">{{ items[0]?.desc }}</p>
          <div class="card-tags">
            <span v-for="tag in items[0]?.tags" :key="tag" class="tag">{{ tag }}</span>
            <span class="tag tag--warm">{{ items[0]?.tag_warm }}</span>
          </div>
        </div>
        <div class="card-viewport">
          <div class="viewport-bar"><i></i><i></i><i></i></div>
          <svg viewBox="0 0 380 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="wg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#1d4250" stop-opacity=".5"/>
                <stop offset="1" stop-color="#0c1016"/>
              </linearGradient>
            </defs>
            <rect x="20" y="16" width="340" height="70" rx="8" fill="url(#wg1)"/>
            <rect x="34" y="32" width="120" height="9" rx="4" fill="#fff" opacity=".5"/>
            <rect x="34" y="48" width="180" height="7" rx="3" fill="#fff" opacity=".25"/>
            <rect x="20" y="98" width="164" height="64" rx="8" fill="#fff" opacity=".04" stroke="#fff" stroke-opacity=".07"/>
            <rect x="196" y="98" width="164" height="64" rx="8" fill="#D69A6A" opacity=".12" stroke="#D69A6A" stroke-opacity=".25"/>
            <rect x="20" y="174" width="104" height="58" rx="8" fill="#fff" opacity=".04" stroke="#fff" stroke-opacity=".07"/>
            <rect x="136" y="174" width="104" height="58" rx="8" fill="#fff" opacity=".04" stroke="#fff" stroke-opacity=".07"/>
            <rect x="252" y="174" width="108" height="58" rx="8" fill="#fff" opacity=".04" stroke="#fff" stroke-opacity=".07"/>
          </svg>
        </div>
      </article>

      <!-- Card 1 — stories player (reversed) -->
      <article
        ref="card1"
        class="work-card glass-card reveal rv-d2 work-card--reverse"
        :class="{ 'work-card--reverse': reversed[1] }"
      >
        <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div><div class="glare-blob-2"></div></div></div>
        <div class="card-body">
          <p class="eyebrow card-kicker">{{ items[1]?.kicker }}</p>
          <h3 class="card-title">{{ items[1]?.title }}</h3>
          <p class="card-desc">{{ items[1]?.desc }}</p>
          <div class="card-tags">
            <span v-for="tag in items[1]?.tags" :key="tag" class="tag">{{ tag }}</span>
            <span class="tag tag--warm">{{ items[1]?.tag_warm }}</span>
          </div>
        </div>
        <div class="card-viewport">
          <div class="viewport-bar"><i></i><i></i><i></i></div>
          <svg viewBox="0 0 380 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="wg2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#25224A" stop-opacity=".6"/>
                <stop offset="1" stop-color="#0c1016"/>
              </linearGradient>
            </defs>
            <rect x="148" y="20" width="84" height="210" rx="14" fill="url(#wg2)" stroke="#fff" stroke-opacity=".1"/>
            <rect x="156" y="30" width="22" height="3" rx="1.5" fill="#D69A6A"/>
            <rect x="181" y="30" width="22" height="3" rx="1.5" fill="#fff" opacity=".25"/>
            <rect x="206" y="30" width="18" height="3" rx="1.5" fill="#fff" opacity=".25"/>
            <circle cx="166" cy="48" r="7" fill="#fff" opacity=".15"/>
            <rect x="178" y="44" width="40" height="6" rx="3" fill="#fff" opacity=".2"/>
            <rect x="156" y="64" width="68" height="120" rx="8" fill="#D69A6A" opacity=".1"/>
            <path d="M180 116l22 12-22 12z" fill="#fff" opacity=".4"/>
            <rect x="156" y="196" width="68" height="22" rx="11" fill="#fff" opacity=".06" stroke="#fff" stroke-opacity=".1"/>
          </svg>
        </div>
      </article>

      <!-- Card 2 — bot / payment funnel -->
      <article
        ref="card2"
        class="work-card glass-card reveal rv-d3"
      >
        <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div><div class="glare-blob-2"></div></div></div>
        <div class="card-body">
          <p class="eyebrow card-kicker">{{ items[2]?.kicker }}</p>
          <h3 class="card-title">{{ items[2]?.title }}</h3>
          <p class="card-desc">{{ items[2]?.desc }}</p>
          <div class="card-tags">
            <span v-for="tag in items[2]?.tags" :key="tag" class="tag">{{ tag }}</span>
            <span class="tag tag--warm">{{ items[2]?.tag_warm }}</span>
          </div>
        </div>
        <div class="card-viewport">
          <div class="viewport-bar"><i></i><i></i><i></i></div>
          <svg viewBox="0 0 380 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect x="24"  y="28"  width="150" height="34" rx="10" fill="#fff" opacity=".05" stroke="#fff" stroke-opacity=".08"/>
            <rect x="36"  y="40"  width="100" height="6"  rx="3"  fill="#fff" opacity=".3"/>
            <rect x="120" y="74"  width="150" height="34" rx="10" fill="#D69A6A" opacity=".12" stroke="#D69A6A" stroke-opacity=".25"/>
            <rect x="132" y="86"  width="110" height="6"  rx="3"  fill="#D69A6A" opacity=".5"/>
            <rect x="24"  y="120" width="150" height="34" rx="10" fill="#fff" opacity=".05" stroke="#fff" stroke-opacity=".08"/>
            <rect x="36"  y="132" width="80"  height="6"  rx="3"  fill="#fff" opacity=".3"/>
            <rect x="206" y="150" width="150" height="76" rx="12" fill="#15414F" opacity=".25" stroke="#fff" stroke-opacity=".1"/>
            <rect x="220" y="166" width="60"  height="7"  rx="3"  fill="#fff" opacity=".4"/>
            <rect x="220" y="182" width="122" height="20" rx="6"  fill="#D69A6A" opacity=".18" stroke="#D69A6A" stroke-opacity=".3"/>
            <rect x="248" y="189" width="66"  height="6"  rx="3"  fill="#D69A6A" opacity=".6"/>
            <path d="M174 137h26v18l8 4-8 4v18" stroke="#D69A6A" stroke-opacity=".4" fill="none"/>
          </svg>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.section-work {
  padding: clamp(4.375rem, 9vw, 8.75rem) 0;
}

.work-list {
  display: flex;
  flex-direction: column;
  gap: 1.375rem;
}

/* ── Work card ─────────────────────────────────────────────────────────────── */
.work-card {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border-radius: var(--radius-card);
}
.work-card--reverse {
  grid-template-columns: 0.95fr 1.05fr;
}
.work-card--reverse .card-body  { order: 2; }
.work-card--reverse .card-viewport { order: 1; }

/* ── Card body ─────────────────────────────────────────────────────────────── */
.card-body {
  padding: clamp(1.5rem, 3vw, 2.5rem);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}
.card-kicker {
  margin-bottom: auto;
}
.card-title {
  font-size: clamp(1.25rem, 0.875rem + 1vw, 1.6875rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  margin: 1.625rem 0 0.75rem;
  line-height: 1.14;
}
.card-desc {
  color: var(--mist);
  font-size: 0.9375rem;
  max-width: 44ch;
}

/* ── Tags ──────────────────────────────────────────────────────────────────── */
.card-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
.tag {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--mist);
  padding: 0.3125rem 0.625rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: oklch(100% 0 0 / 2%);
}
.tag--warm {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

/* ── Viewport (mock browser) ───────────────────────────────────────────────── */
.card-viewport {
  position: relative;
  margin: 0.875rem;
  border-radius: var(--radius-viewport);
  overflow: hidden;
  z-index: 2;
  background: linear-gradient(135deg, #0c1016, #0a0d12);
  border: 1px solid var(--line-soft);
  min-height: 15rem;
}
.viewport-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.75rem;
  border-bottom: 1px solid var(--line-soft);
  background: oklch(100% 0 0 / 2%);
  z-index: 2;
}
.viewport-bar i {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--line);
  display: block;
}
.card-viewport svg {
  position: absolute;
  inset: 1.875rem 0 0;
  width: 100%;
  height: calc(100% - 1.875rem);
  display: block;
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 47.5em) {
  .work-card,
  .work-card--reverse {
    grid-template-columns: 1fr;
  }
  .work-card--reverse .card-body,
  .work-card--reverse .card-viewport {
    order: unset;
  }
  .work-card--reverse .card-viewport {
    order: -1;
  }
  .card-viewport {
    min-height: 12.5rem;
  }
}
</style>
