<script setup lang="ts">
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()

const scrolled = ref(false)

onMounted(() => {
  const onScroll = () => { scrolled.value = window.scrollY > 24 }
  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})
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
    border-color    0.6s var(--ease-silk);
}

.nav--glass {
  background: oklch(100% 0 0 / 2.5%);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border-bottom-color: var(--line);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px clamp(20px, 5vw, 96px);
}

/* ── Brand logo ──────────────────────────────────────────────────────────── */
.brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo {
  height: 11px;
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
  gap: 24px;
  align-items: center;
}

.navlink {
  position: relative;
  color: var(--mist);
  text-decoration: none;
  font-size: 13.5px;
  padding-bottom: 3px;
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
  gap: 7px;
  color: var(--mist);
  text-decoration: none;
  font-size: 13.5px;
  transition: color 0.3s var(--ease-silk);
}

.avail:hover {
  color: var(--ink);
}

.avail-dot {
  width: 6px;
  height: 6px;
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
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 2px;
}

/* the pill that slides between EN and RU */
.lang::before {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc(50% - 3px);
  border-radius: 5px;
  background: var(--ember-bg);
  transition: transform 0.38s var(--ease-glide);
  pointer-events: none;
}

/* slide pill to second button when RU is active */
.lang:has(.lang-btn:nth-child(2).lang-btn--on)::before {
  transform: translateX(calc(100% + 2px));
}

.lang-btn {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--faint);
  padding: 4px 8px;
  border-radius: 5px;
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
  border-radius: 7px;
  padding: 7px 12px;
  color: var(--ink);
  text-decoration: none;
  font-size: 13.5px;
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
@media (max-width: 760px) {
  .navlink,
  .nav-cv {
    display: none;
  }
}
</style>
