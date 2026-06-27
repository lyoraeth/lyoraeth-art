<script setup lang="ts">
import { useReadingProgress } from '~/composables/useReadingProgress'
import type { WorkItem } from '../../server/api/work.get'
import type { PostItem } from '../../server/api/posts.get'

const { t, locale } = useI18n()
const switchLocalePathRaw = useSwitchLocalePath()
const localePath = useLocalePath()
const loc = useLoc()
const formatDate = useFormatDate()
const route = useRoute()

const { data: navWork } = useFetch<WorkItem[]>('/api/work', {
  query: { limit: 3 },
  default: () => [] as WorkItem[],
  lazy: true,
})

const { data: navPosts } = useFetch<PostItem[]>('/api/posts', {
  query: { limit: 3 },
  default: () => [] as PostItem[],
  lazy: true,
})

const switchLocalePath = (code: string) => switchLocalePathRaw(code as 'en' | 'ru').split('#')[0] || '/'

const { data: statusData } = useFetch('/api/status', { default: () => ({ availability: 'available' }) })
const availability = computed(() => statusData.value?.availability ?? 'available')

const DOT_COLORS: Record<string, string> = {
  available:   '#D69A6A',           /* ember — оригинальный акцент */
  part_time:   'oklch(78% 0.1 88)', /* тёплый золотисто-жёлтый */
  busy:        'oklch(58% 0.12 22)',/* тёплый rust/кирпич */
  unavailable: '#5B6573',           /* var(--faint) — приглушённый серый */
}
const DOT_ANIMATION: Record<string, string> = {
  available:   'pulse 2.8s ease-in-out infinite',
  part_time:   'pulse 4.5s ease-in-out infinite',
  busy:        'none',
  unavailable: 'none',
}
const dotStyle = computed(() => ({
  background: DOT_COLORS[availability.value] ?? DOT_COLORS.available,
  animation:  DOT_ANIMATION[availability.value] ?? 'none',
}))

const isHome = computed(() => {
  const home = localePath('/')
  return route.path === home || route.path === home.replace(/\/$/, '')
})

function navTo(hash: string, page?: string) {
  if (isHome.value) return `#${hash}`
  if (page) return localePath(page)
  return localePath('/') + `#${hash}`
}

const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 24 }

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const { progress, active } = useReadingProgress()

const workOpen    = ref(false)
const writingOpen = ref(false)
const workAnchor    = ref<HTMLElement>()
const writingAnchor = ref<HTMLElement>()

let workTimer: ReturnType<typeof setTimeout>
let writingTimer: ReturnType<typeof setTimeout>

function openWork()    { clearTimeout(workTimer);    workOpen.value = true }
function closeWork()   { workTimer    = setTimeout(() => { workOpen.value    = false }, 150) }
function openWriting() { clearTimeout(writingTimer); writingOpen.value = true }
function closeWriting(){ writingTimer = setTimeout(() => { writingOpen.value = false }, 150) }

function anchorPos(el: HTMLElement | undefined) {
  if (!el) return { left: '0px', top: '0px' }
  const r = el.getBoundingClientRect()
  const gap = scrolled.value ? 32 : 14
  return { left: `${r.left + r.width / 2}px`, top: `${r.bottom + gap}px` }
}
const workPos    = computed(() => anchorPos(workAnchor.value))
const writingPos = computed(() => anchorPos(writingAnchor.value))
</script>

<template>
  <nav class="nav" :class="{ 'nav--glass': scrolled }" :aria-label="t('nav.site_nav')">
    <div
      class="reading-bar"
      :class="{ 'reading-bar--visible': active && scrolled }"
      :style="{ width: progress + '%' }"
      aria-hidden="true"
    />
    <div class="nav-inner">
      <NuxtLink :to="localePath('/')" class="brand">
        <img src="/logo.svg" alt="lyoraeth" class="brand-logo" width="256" height="45" />
      </NuxtLink>

      <div class="nav-links">
        <!-- Work with dropdown -->
        <div
          ref="workAnchor"
          class="drop-wrap"
          @mouseenter="openWork"
          @mouseleave="closeWork"
        >
          <NuxtLink :to="navTo('work', '/work')" class="navlink">{{ t('nav.work') }}</NuxtLink>
        </div>

        <NuxtLink :to="navTo('stack')" class="navlink">{{ t('nav.stack') }}</NuxtLink>

        <!-- Writing with dropdown -->
        <div
          ref="writingAnchor"
          class="drop-wrap"
          @mouseenter="openWriting"
          @mouseleave="closeWriting"
        >
          <NuxtLink :to="navTo('writing', '/writing')" class="navlink">{{ t('nav.writing') }}</NuxtLink>
        </div>

        <NuxtLink :to="navTo('contact')" class="avail">
          <span class="avail-dot" :style="dotStyle" aria-hidden="true" />
          <span>{{ t(`nav.status.${availability}`) }}</span>
        </NuxtLink>

        <div class="lang" role="group" :aria-label="t('nav.lang_toggle')">
          <NuxtLink
            :to="switchLocalePath('en')"
            class="lang-btn"
            :class="{ 'lang-btn--on': locale === 'en' }"
            :aria-current="locale === 'en' ? 'true' : undefined"
          >EN</NuxtLink>
          <NuxtLink
            :to="switchLocalePath('ru')"
            class="lang-btn"
            :class="{ 'lang-btn--on': locale === 'ru' }"
            :aria-current="locale === 'ru' ? 'true' : undefined"
          >RU</NuxtLink>
        </div>

        <NuxtLink :to="navTo('contact')" class="nav-cv">{{ t('nav.cv') }}</NuxtLink>
      </div>
    </div>
  </nav>

  <!-- Work dropdown (teleported outside nav stacking context) -->
  <Teleport to="body">
    <Transition name="drop">
      <div
        v-if="workOpen"
        class="dropdown"
        :class="{ 'dropdown--dark': scrolled }"
        role="menu"
        :style="workPos"
        @mouseenter="openWork"
        @mouseleave="closeWork"
      >
        <template v-if="navWork?.length">
          <span class="drop-label">{{ t('nav.drop_work_label') }}</span>
          <NuxtLink
            v-for="item in navWork"
            :key="item._id"
            :to="localePath(`/work/${item.slug}`)"
            class="drop-item"
            role="menuitem"
          >
            <span class="drop-item-title">{{ loc(item.title) }}</span>
            <span class="drop-item-meta">{{ item.year ?? '' }}</span>
          </NuxtLink>
          <div class="drop-divider" />
        </template>
        <NuxtLink :to="localePath('/work')" class="drop-all" role="menuitem">
          {{ t('nav.drop_all_work') }} <span class="drop-arrow">→</span>
        </NuxtLink>
      </div>
    </Transition>
  </Teleport>

  <!-- Writing dropdown -->
  <Teleport to="body">
    <Transition name="drop">
      <div
        v-if="writingOpen"
        class="dropdown"
        :class="{ 'dropdown--dark': scrolled }"
        role="menu"
        :style="writingPos"
        @mouseenter="openWriting"
        @mouseleave="closeWriting"
      >
        <template v-if="navPosts?.length">
          <span class="drop-label">{{ t('nav.drop_writing_label') }}</span>
          <NuxtLink
            v-for="post in navPosts"
            :key="post._id"
            :to="localePath(`/writing/${post.slug}`)"
            class="drop-item"
            role="menuitem"
          >
            <span class="drop-item-title">{{ loc(post.title) }}</span>
            <span class="drop-item-meta">{{ formatDate(post.publishedAt) }}</span>
          </NuxtLink>
          <div class="drop-divider" />
        </template>
        <NuxtLink :to="localePath('/writing')" class="drop-all" role="menuitem">
          {{ t('nav.drop_all_posts') }} <span class="drop-arrow">→</span>
        </NuxtLink>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Nav shell ───────────────────────────────────────────────────────────── */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  border-bottom: 1px solid transparent;
  transition:
    background      0.6s var(--ease-silk),
    backdrop-filter 0.6s var(--ease-silk),
    border-color    0.6s var(--ease-silk),
    box-shadow      0.6s var(--ease-silk);
}

.nav--glass {
  background: rgba(14, 18, 26, 0.72);
  background: oklch(13% 0.009 235 / 72%);
  backdrop-filter: blur(18px) saturate(1.5) brightness(1.03);
  -webkit-backdrop-filter: blur(18px) saturate(1.5) brightness(1.03);
  border-bottom-color: var(--line-soft);
}

.nav-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.125rem clamp(1.25rem, 0.1538rem + 4.8718vw, 6rem);
}

/* ── Brand logo ──────────────────────────────────────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo {
  height: 0.6875rem;
  width: auto;
  display: block;
  transition: opacity 0.3s var(--ease-silk);
}

.brand:hover .brand-logo {
  opacity: 0.85;
}

/* ── Nav links ───────────────────────────────────────────────────────────── */
.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.navlink {
  position: relative;
  color: var(--mist);
  text-decoration: none;
  font-size: 0.84375rem;
  padding-bottom: 0.1875rem;
  transition: color 0.3s var(--ease-silk);
}

/* ember underline — slides in from left on hover */
.navlink::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--ember);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease-out-expo);
}

.navlink:hover {
  color: var(--ink);
}

.navlink:hover::after {
  transform: scaleX(1);
}

/* ── Available indicator ─────────────────────────────────────────────────── */
.avail {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  color: var(--mist);
  text-decoration: none;
  font-size: 0.84375rem;
  transition: color 0.3s var(--ease-silk);
}

.avail:hover {
  color: var(--ink);
}

.avail-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1;    transform: scale(1); }
  50%       { opacity: 0.8; transform: scale(0.9); }
}

/* ── Lang switcher — sliding pill ───────────────────────────────────────── */
.lang {
  position: relative;
  display: flex;
  gap: 0;
  border: 1px solid var(--line);
  border-radius: 0.4375rem;
  padding: 0.125rem;
  background: rgba(255, 255, 255, 0.03);
  background: oklch(100% 0 0 / 3%);
  backdrop-filter: blur(10px) saturate(1.45) brightness(1.05);
  -webkit-backdrop-filter: blur(10px) saturate(1.45) brightness(1.05);
}

/* the pill that slides between EN and RU */
.lang::before {
  content: '';
  position: absolute;
  top: 0.125rem;
  bottom: 0.125rem;
  left: 0.125rem;
  width: calc(50% - 0.125rem);
  border-radius: 0.3125rem;
  background: var(--ember-bg);
  transition: transform 0.26s var(--ease-glide);
  pointer-events: none;
}

/* translateX(100%) = exactly one button width — no gap in the math */
.lang:has(.lang-btn:nth-child(2).lang-btn--on)::before {
  transform: translateX(100%);
}

.lang-btn {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--faint);
  padding: 0.25rem 0.5rem;
  border-radius: 0.3125rem;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.3s var(--ease-silk);
  position: relative;
  z-index: 1;
}

.lang-btn--on {
  color: var(--ink);
}

/* ── CV button ───────────────────────────────────────────────────────────── */
.nav-cv {
  border: 1px solid var(--line);
  border-radius: 0.4375rem;
  padding: 0.4375rem 0.75rem;
  color: var(--ink);
  text-decoration: none;
  font-size: 0.84375rem;
  background: rgba(255, 255, 255, 0.03);
  background: oklch(100% 0 0 / 3%);
  backdrop-filter: blur(10px) saturate(1.3);
  -webkit-backdrop-filter: blur(10px) saturate(1.3);
  transition:
    border-color 0.3s var(--ease-out-expo),
    background   0.3s var(--ease-out-expo);
}

.nav-cv:hover {
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

.nav-cv:active {
  background: rgba(214, 154, 106, 0.18);
  background: color-mix(in srgb, var(--ember) 18%, transparent);
}

/* ── Nav dropdown ────────────────────────────────────────────────────────── */
.drop-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.dropdown {
  position: fixed;
  transform: translateX(-50%);
  min-width: 13rem;
  padding: 0.625rem;
  border-radius: var(--radius-card-sm);
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  z-index: 100;

  background: rgba(255, 255, 255, 0.04);
  background: oklch(100% 0 0 / 4%);
  backdrop-filter: blur(24px) saturate(1.6) brightness(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(1.6) brightness(1.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border: 1px solid oklch(100% 0 0 / 10%);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 12%),
    0 1rem 2rem -0.5rem oklch(0% 0 0 / 40%);
  transition: top 0.4s var(--ease-silk), background 0.6s var(--ease-silk), box-shadow 0.6s var(--ease-silk);
}

.dropdown--dark {
  background: rgba(10, 13, 18, 0.72);
  background: oklch(10% 0.008 235 / 72%);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 12%),
    0 1rem 2rem -0.5rem oklch(0% 0 0 / 60%);
}

/* Vue Transition */
.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.18s var(--ease-silk), transform 0.18s var(--ease-out-expo);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}
.drop-enter-to,
.drop-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.drop-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--faint);
  padding: 0.25rem 0.5rem 0.375rem;
}

.drop-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  text-decoration: none;
  transition: background 0.15s;
}

.drop-item:hover {
  background: oklch(100% 0 0 / 4%);
}

.drop-item-title {
  font-size: 0.8125rem;
  color: var(--ink);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 14rem;
}

.drop-item-meta {
  font-size: 0.6875rem;
  color: var(--faint);
  font-family: 'JetBrains Mono', monospace;
}

.drop-divider {
  height: 1px;
  background: var(--line-soft);
  margin: 0.375rem 0.5rem;
}

.drop-all {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: var(--ember);
  text-decoration: none;
  transition: background 0.15s;
}

.drop-all:hover {
  background: var(--ember-bg);
}

.drop-arrow {
  display: inline-block;
  transition: transform 0.25s var(--ease-out-expo);
}

.drop-all:hover .drop-arrow {
  transform: translateX(0.2rem);
}

/* ── Reading progress bar ────────────────────────────────────────────────── */
.reading-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1.5px;
  background: var(--ember);
  pointer-events: none;
  opacity: 0;
  transition:
    opacity 0.5s var(--ease-silk),
    width 0.08s linear;
}

.reading-bar--visible {
  opacity: 1;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 47.5em) {
  .navlink,
  .nav-cv,
  .avail,
  .lang {
    display: none;
  }
}
</style>
