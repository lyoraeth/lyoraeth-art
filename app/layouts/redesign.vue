<script setup lang="ts">
/**
 * Light shell of the redesign. Header and footer arrive with their own stages;
 * for now it carries the page frame and the base layer that the dark shell
 * defines differently.
 */
useHead({
  htmlAttrs: { class: 'shell-redesign' },
  meta: [
    { name: 'theme-color', content: '#FAFAFA' },
    { name: 'color-scheme', content: 'light' },
  ],
})
</script>

<template>
  <main id="main-content" class="wrapper px-page-padding-x flex flex-col gap-y-section-gap">
    <slot />
  </main>
</template>

<style>
/*
 * No overflow-x: hidden here, unlike the dark shell: it silently disables
 * position: sticky, which the redesign header relies on.
 */
html.shell-redesign {
  /* anchors stop below the header instead of under it */
  scroll-padding-top: var(--spacing-header-height);
}

html.shell-redesign body {
  /* full-height column, so a short page still pins the footer to the bottom */
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  background-color: var(--color-surface-page);
  color: var(--color-text-primary);

  /* starting point is short-form text; blocks override it with type-* */
  font-family: var(--font-sans);
  font-size: var(--text-text);
  line-height: var(--text-text--line-height);
  font-weight: var(--text-text--font-weight);
}

html.shell-redesign main {
  flex: 1 1 auto;
}

html.shell-redesign :focus-visible {
  outline: 2px solid var(--color-accent-default);
  outline-offset: 2px;
}

/*
 * Animations are reduced to instant rather than removed: transitions that wait
 * on transitionend break outright when they never run.
 */
@media (prefers-reduced-motion: reduce) {
  html.shell-redesign *,
  html.shell-redesign *::before,
  html.shell-redesign *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
