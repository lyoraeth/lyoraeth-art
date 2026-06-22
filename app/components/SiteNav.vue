<script setup lang="ts">
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()

const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 24 }

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav class="nav" :class="{ 'nav--glass': scrolled }">
    <div class="nav-inner">
      <NuxtLink :to="localePath('/')" class="brand">
        <img src="/logo.svg" alt="lyoraeth" class="brand-logo" />
      </NuxtLink>

      <div class="nav-links">
        <a href="#work"    class="navlink">{{ t('nav.work') }}</a>
        <a href="#stack"   class="navlink">{{ t('nav.stack') }}</a>
        <a href="#writing" class="navlink">{{ t('nav.writing') }}</a>

        <a href="#contact" class="avail">
          <span class="avail-dot" aria-hidden="true" />
          <span>{{ t('nav.available') }}</span>
        </a>

        <div class="lang" role="group" :aria-label="t('nav.lang_toggle')">
          <NuxtLink
            :to="switchLocalePath('en')"
            class="lang-btn"
            :class="{ 'lang-btn--on': locale === 'en' }"
          >EN</NuxtLink>
          <NuxtLink
            :to="switchLocalePath('ru')"
            class="lang-btn"
            :class="{ 'lang-btn--on': locale === 'ru' }"
          >RU</NuxtLink>
        </div>

        <a href="#contact" class="nav-cv">{{ t('nav.cv') }}</a>
      </div>
    </div>
  </nav>
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
  background: var(--ember);
  flex-shrink: 0;
  animation: pulse 2.8s ease-in-out infinite;
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
  background: color-mix(in srgb, var(--ember) 18%, transparent);
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
