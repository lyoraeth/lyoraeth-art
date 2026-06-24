<script setup lang="ts">
const { t, locale } = useI18n()
const switchLocalePathRaw = useSwitchLocalePath()
const localePath = useLocalePath()
const route = useRoute()

const switchLocalePath = (code: string) => switchLocalePathRaw(code as 'en' | 'ru').split('#')[0] || '/'

const isHome = computed(() => {
  const home = localePath('/')
  return route.path === home || route.path === home.replace(/\/$/, '')
})

function navTo(hash: string) {
  if (isHome.value) return `#${hash}`
  return localePath('/') + `#${hash}`
}
</script>

<template>
  <nav class="dock" aria-label="Mobile navigation">
    <NuxtLink :to="navTo('work')"    class="dock-link">{{ t('nav.work') }}</NuxtLink>
    <NuxtLink :to="navTo('stack')"   class="dock-link">{{ t('nav.stack') }}</NuxtLink>
    <NuxtLink :to="navTo('writing')" class="dock-link">{{ t('nav.writing') }}</NuxtLink>
    <NuxtLink :to="navTo('contact')" class="dock-link">{{ t('nav.contact') }}</NuxtLink>

    <span class="dock-sep" aria-hidden="true" />

    <div class="dock-lang" role="group" :aria-label="t('nav.lang_toggle')">
      <NuxtLink
        :to="switchLocalePath('en')"
        class="dock-lang-btn"
        :class="{ 'dock-lang-btn--on': locale === 'en' }"
        :aria-current="locale === 'en' ? 'true' : undefined"
      >EN</NuxtLink>
      <NuxtLink
        :to="switchLocalePath('ru')"
        class="dock-lang-btn"
        :class="{ 'dock-lang-btn--on': locale === 'ru' }"
        :aria-current="locale === 'ru' ? 'true' : undefined"
      >RU</NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.dock {
  display: none;
}

@media (max-width: 47.5em) {
  .dock {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    position: fixed;
    bottom: max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem));
    left: 50%;
    transform: translateX(-50%);
    z-index: 60;
    max-width: calc(100vw - 2rem);
    padding: 0.375rem;
    border-radius: 1rem;
    overflow: hidden;

    /* Fluid glass — richer than plain blur */
    backdrop-filter: blur(22px) saturate(1.65) brightness(1.06);
    -webkit-backdrop-filter: blur(22px) saturate(1.65) brightness(1.06);

    /* Layered background: warm top wash + dark body + bottom depth tint */
    background:
      linear-gradient(to bottom, transparent 55%, oklch(0% 0 0 / 18%) 100%),
      linear-gradient(160deg, oklch(100% 0 0 / 5.5%) 0%, oklch(100% 0 0 / 0%) 35%),
      oklch(13% 0.009 235 / 74%);

    /* Edge refraction simulation — sub-pixel values stay in px */
    border: 1px solid oklch(100% 0 0 / 13%);
    box-shadow:
      inset 0  1.5px 0   oklch(100% 0 0 / 22%),
      inset 0 -0.5px 0   oklch(100% 0 0 / 7%),
      inset  0.5px 0 0   oklch(100% 0 0 / 9%),
      inset -0.5px 0 0   oklch(100% 0 0 / 9%),
      0  0.25rem 1rem    -0.25rem  oklch(0% 0 0 / 45%),
      0  1.5rem  3.5rem  -1.125rem oklch(0% 0 0 / 72%);

    animation: dock-rise 0.5s var(--ease-out-expo) both;
    animation-delay: 0.25s;
  }

  /* Caustic highlight — simulates non-uniform light through curved glass */
  .dock::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(ellipse 85% 65% at 32% -25%, oklch(100% 0 0 / 13%) 0%, transparent 62%),
      radial-gradient(ellipse 45% 30% at 75% 130%, oklch(65% 0.04 55 / 7%) 0%, transparent 55%);
    mix-blend-mode: screen;
    pointer-events: none;
    filter: url(#glass-caustic);
  }
}

/* Dock content must sit above ::before caustic layer */
@media (max-width: 47.5em) {
  .dock-link,
  .dock-sep,
  .dock-lang {
    position: relative;
    z-index: 1;
  }
}

@keyframes dock-rise {
  from { opacity: 0; transform: translateX(-50%) translateY(1rem); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ── Nav links ───────────────────────────────────────────────────────────── */
.dock-link {
  color: var(--mist);
  text-decoration: none;
  font-size: 0.78125rem;
  padding: 0.5625rem 0.6875rem;
  border-radius: 0.6875rem;
  transition: color 0.2s var(--ease-silk), background 0.2s var(--ease-silk);
  white-space: nowrap;
}

.dock-link:hover,
.dock-link:active {
  color: var(--ink);
  background: oklch(100% 0 0 / 5%);
}

/* ── Separator ───────────────────────────────────────────────────────────── */
.dock-sep {
  width: 1px;
  height: 1.25rem;
  background: var(--line-soft);
  flex-shrink: 0;
  margin: 0 0.1875rem;
}

/* ── Lang switcher ───────────────────────────────────────────────────────── */
.dock-lang {
  position: relative;
  display: flex;
  gap: 0;
  padding: 0.125rem;
}

.dock-lang::before {
  content: '';
  position: absolute;
  top: 0.125rem;
  bottom: 0.125rem;
  left: 0.125rem;
  width: calc(50% - 0.125rem);
  border-radius: 0.4375rem;
  background: var(--ember-bg);
  transition: transform 0.28s var(--ease-glide);
  pointer-events: none;
}

.dock-lang:has(.dock-lang-btn:nth-child(2).dock-lang-btn--on)::before {
  transform: translateX(100%);
}

.dock-lang-btn {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--faint);
  padding: 0.4375rem 0.5625rem;
  border-radius: 0.4375rem;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: color 0.25s var(--ease-silk);
  position: relative;
  z-index: 1;
}

.dock-lang-btn--on {
  color: var(--ink);
}
</style>
