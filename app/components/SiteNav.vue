<script setup lang="ts">
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
</script>

<template>
  <nav class="nav">
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
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px clamp(1.25rem, 0.1538rem + 4.8718vw, 6rem);
}

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
}

.nav-links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.navlink {
  color: var(--mist);
  text-decoration: none;
  font-size: 13.5px;
}

.navlink:hover {
  color: var(--ink);
}

.avail {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--mist);
  text-decoration: none;
  font-size: 13.5px;
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
}

.lang {
  display: flex;
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 2px;
}

.lang-btn {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--faint);
  padding: 4px 8px;
  border-radius: 5px;
  letter-spacing: 0.05em;
  text-decoration: none;
}

.lang-btn--on {
  color: var(--ink);
  background: var(--ember-bg);
}

.nav-cv {
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 7px 12px;
  color: var(--ink);
  text-decoration: none;
  font-size: 13.5px;
}

.nav-cv:hover {
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

@media (max-width: 760px) {
  .navlink,
  .nav-cv {
    display: none;
  }
}
</style>
