<script setup lang="ts">
/**
 * Writing section — placeholder data until API is wired.
 * Posts will be fetched per-locale and displayed with full pagination on /writing/*.
 * The featured post + 2 mini cards shown here represent the 3 most recent.
 */
const { t, locale } = useI18n()

interface Post {
  slug: string
  date: string
  readMin: number
  title: { en: string; ru: string }
  tags: string[]
}

const posts: Post[] = [
  {
    slug: 'dvh-fix',
    date: '25.03.2026',
    readMin: 5,
    title: {
      en: 'Why dvh is unreliable, and how I fixed it',
      ru: 'Почему dvh ненадёжен и как я это починил',
    },
    tags: ['mobile', 'viewport', 'css'],
  },
  {
    slug: 'design-system-no-build',
    date: '18.02.2026',
    readMin: 7,
    title: {
      en: 'A design system on a site with no build step',
      ru: 'Дизайн-система на сайте без сборки',
    },
    tags: [],
  },
  {
    slug: 'vue2-onboarding',
    date: '19.06.2026',
    readMin: 4,
    title: {
      en: 'Onboarding myself onto Vue 2 / Node 12 in three hours',
      ru: 'Самостоятельный онбординг на Vue 2 / Node 12 за три часа',
    },
    tags: [],
  },
]

const featured  = posts[0]
const secondary = posts.slice(1)

function postTitle(post: Post) {
  return locale.value === 'ru' ? post.title.ru : post.title.en
}

/* ── Template refs (shared between reveal + glow) ── */
const headRef = ref<HTMLElement | null>(null)
const featRef = ref<HTMLElement | null>(null)
const mini0   = ref<HTMLElement | null>(null)
const mini1   = ref<HTMLElement | null>(null)

/* ── Scroll reveal ── */
const { observe } = useReveal()
onMounted(() => {
  observe(headRef.value)
  observe(featRef.value)
  observe(mini0.value)
  observe(mini1.value)
})

/* ── Glow cards ── */
useGlowCard(featRef)
useGlowCard(mini0)
useGlowCard(mini1)
</script>

<template>
  <section id="writing" class="section-writing">
    <div class="sec-head reveal" ref="headRef">
      <h2>{{ t('writing.title') }}</h2>
    </div>

    <div class="writing-wrap">
      <!-- Featured post -->
      <a
        :href="`/writing/${featured.slug}`"
        class="feat glass-card reveal rv-d1"
        ref="featRef"
      >
        <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div><div class="glare-blob-2"></div></div></div>

        <div class="feat-thumb">
          <svg viewBox="0 0 300 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <line x1="30" y1="200" x2="280" y2="200" stroke="#fff" stroke-opacity=".12"/>
            <line x1="30" y1="40"  x2="30"  y2="200" stroke="#fff" stroke-opacity=".12"/>
            <polyline points="30,150 70,90 90,150 120,70 150,160 180,80 210,150 250,100"
              fill="none" stroke="#8B95A3" stroke-width="2" stroke-opacity=".5"/>
            <polyline points="30,120 280,120"
              fill="none" stroke="#D69A6A" stroke-width="2"/>
            <text x="240" y="114" font-family="monospace" font-size="9" fill="#D69A6A">--real-vh</text>
            <text x="180" y="64"  font-family="monospace" font-size="9" fill="#8B95A3">dvh</text>
          </svg>
          <span class="feat-thumb-caption mono">fig.01 — dvh vs --real-vh</span>
        </div>

        <div class="feat-body">
          <div class="feat-meta">
            <span class="mono feat-date">{{ featured.date }}</span>
            <span class="feat-dot"></span>
            <span class="mono">{{ t('writing.min', { n: featured.readMin }) }}</span>
          </div>
          <h3 class="feat-title">{{ postTitle(featured) }}</h3>
          <div class="feat-tags">
            <span v-for="tag in featured.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <span class="feat-read">
            {{ t('writing.read') }} <span class="feat-arrow">→</span>
          </span>
        </div>
      </a>

      <!-- Secondary posts -->
      <div class="more-writing">
        <a
          v-for="(post, i) in secondary"
          :key="post.slug"
          :href="`/writing/${post.slug}`"
          class="mini-card glass-card reveal rv-d2"
          :ref="(el) => { if (i === 0) mini0 = el as HTMLElement | null; else mini1 = el as HTMLElement | null }"
        >
          <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div></div></div>
          <div class="mini-meta">
            <span class="mono mini-date">{{ post.date }}</span>
            <span class="mini-dot"></span>
            <span class="mono">{{ t('writing.min', { n: post.readMin }) }}</span>
          </div>
          <span class="mini-title">{{ postTitle(post) }}</span>
          <span class="mini-read">
            {{ t('writing.read') }} <span class="mini-arrow">→</span>
          </span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-writing {
  padding: clamp(4.375rem, 9vw, 8.75rem) 0;
}

.writing-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Featured post ─────────────────────────────────────────────────────────── */
.feat {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  border-radius: var(--radius-card);
  text-decoration: none;
  color: inherit;
}
.feat:hover {
  border-color: oklch(72% 0.1 58 / 30%);
}

.feat-thumb {
  position: relative;
  min-height: 13.75rem;
  background: linear-gradient(135deg, #0c1016, #0a0d12);
  overflow: hidden;
  border-radius: var(--radius-card) 0 0 var(--radius-card);
  z-index: 2;
}
.feat-thumb svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.feat-thumb-caption {
  position: absolute;
  left: 1rem;
  bottom: 0.875rem;
  font-size: 0.65625rem;
  color: var(--faint);
  letter-spacing: 0.1em;
  z-index: 1;
}

.feat-body {
  padding: clamp(1.5rem, 3vw, 2.375rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.feat-meta {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  margin-bottom: 1rem;
  color: var(--faint);
}
.feat-date { font-size: 0.6875rem; }
.feat-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--faint);
  flex-shrink: 0;
}
.feat-title {
  font-size: clamp(1.25rem, 0.875rem + 1vw, 1.625rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 0.875rem;
}
.feat-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
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
.feat-read {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.375rem;
  color: var(--ember);
  font-size: 0.875rem;
}
.feat-arrow {
  display: inline-block;
  transition: transform 0.35s var(--ease-out-expo);
}
.feat:hover .feat-arrow { transform: translateX(0.3125rem); }

/* ── Secondary (mini) cards ────────────────────────────────────────────────── */
.more-writing {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.mini-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: var(--radius-card-sm);
  text-decoration: none;
  color: inherit;
  /* opacity included so .reveal transition isn't overridden by scoped specificity */
  transition:
    opacity      var(--duration-reveal) var(--ease-out-expo),
    transform    0.25s var(--ease-out-expo),
    border-color 0.3s  var(--ease-silk);
}
.mini-card:hover {
  border-color: oklch(72% 0.1 58 / 30%);
  transform: translateY(-0.1875rem);
}

.mini-meta {
  display: flex;
  gap: 0.625rem;
  align-items: center;
  color: var(--faint);
  position: relative;
  z-index: 2;
}
.mini-date { font-size: 0.65625rem; }
.mini-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--faint);
  flex-shrink: 0;
}
.mini-title {
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin-top: auto;
  position: relative;
  z-index: 2;
}
.mini-read {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  color: var(--ember);
  font-size: 0.8125rem;
  position: relative;
  z-index: 2;
}
.mini-arrow {
  display: inline-block;
  transition: transform 0.3s var(--ease-out-expo);
}
.mini-card:hover .mini-arrow { transform: translateX(0.25rem); }

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 42.5em) {
  .feat {
    grid-template-columns: 1fr;
  }
  .feat-thumb {
    min-height: 9.375rem;
    border-radius: var(--radius-card) var(--radius-card) 0 0;
  }
  .more-writing {
    grid-template-columns: 1fr;
  }
}
</style>
