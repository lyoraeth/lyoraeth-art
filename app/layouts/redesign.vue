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

/** Held here, not in the header: the page behind an open menu is what has to
 *  go inert, and that's the shell's element. */
const menuOpen = ref(false)

/** The other source of inert — a page's own overlay (e.g. the case study
 *  cover lightbox), requested through useMainInert(). See useMainInert.ts. */
const pageInert = provideMainInert()

/** Maintenance strip — off unless the CMS flag is set. Shares the fetch with
 *  ContactSection via the key, so it costs nothing extra. */
const loc = useLoc()
const { data: settings } = await useFetch('/api/settings', { key: 'site-settings' })
const noticeText = computed(() =>
  settings.value?.notice?.enabled ? loc(settings.value.notice.text) : '',
)
</script>

<template>
  <SiteNotice v-if="noticeText" :text="noticeText" />
  <SiteHeader v-model:menu-open="menuOpen" />
  <main
    id="main-content"
    class="wrapper px-page-padding-x flex flex-col gap-y-section-gap"
    :inert="menuOpen || pageInert || undefined"
  >
    <slot />
  </main>

  <PageFooter />
</template>

<style>
/* In the shell layer: above the legacy globals, below the utilities. */
@layer shell {
  /*
   * No overflow-x: hidden here, unlike the dark shell: it silently disables
   * position: sticky, which the redesign header relies on.
   */
  html.shell-redesign {
    /* anchors stop below the header instead of under it */
    scroll-padding-top: calc(var(--spacing-header-height) + var(--notice-h, 0px));
  }

  html.shell-redesign body {
    background-color: var(--color-surface-page);
    color: var(--color-text-primary);

    /* starting point is short-form text; blocks override it with type-* */
    font-family: var(--font-sans);
    font-size: var(--text-text);
    line-height: var(--text-text--line-height);
    font-weight: var(--text-text--font-weight);
  }

  /* The column lives on Nuxt's root rather than on body: that is the closest
     ancestor the shell shares, and a block element in between would stop
     `flex: 1` from reaching the footer. */
  html.shell-redesign #__nuxt {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
  }

  html.shell-redesign main {
    flex: 1 1 auto;
  }

  /* Skip link + focus ring. Used to be shared with the dark shell and
     repainted here; that shell is gone, so this is the only definition now. */
  html.shell-redesign .skip-link {
    position: fixed;
    top: -4rem;
    left: 1rem;
    z-index: 9999;
    padding: 0.5rem 1rem;
    background: var(--color-fill-strong);
    color: var(--color-text-inverse);
    border: 1px solid var(--color-fill-strong);
    border-radius: calc(infinity * 1px);
    font-size: var(--text-ui);
    text-decoration: none;
    transition: top var(--duration-hover) var(--ease-out);
  }

  html.shell-redesign .skip-link:focus {
    top: 1rem;
    outline: 2px solid var(--color-accent-default);
    outline-offset: 2px;
  }

  html.shell-redesign :focus-visible {
    outline: 2px solid var(--color-accent-default);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /*
   * The field's own clear button. It appears and disappears on its own — that's
   * native behaviour for input[type="search"], only its look is overridden. The
   * cross is a mask so the color comes from the tokens. Chrome, Edge and Safari
   * draw one; Firefox draws none at all.
   */
  html.shell-redesign input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    background-color: var(--color-icon-default);
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 4.5l7 7M11.5 4.5l-7 7' stroke='%23000' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    mask-size: contain;
    mask-repeat: no-repeat;
    transition: background-color var(--duration-hover) var(--ease-out);
  }

  html.shell-redesign input[type="search"]::-webkit-search-cancel-button:hover {
    background-color: var(--color-text-secondary);
  }

  html.shell-redesign input[type="search"]::-webkit-search-cancel-button:active {
    background-color: var(--color-accent-strong);
    transition-duration: var(--duration-press);
  }

  /* decorative WebKit pseudo-elements, redundant once the field is drawn by hand */
  html.shell-redesign input[type="search"]::-webkit-search-decoration,
  html.shell-redesign input[type="search"]::-webkit-search-results-button {
    -webkit-appearance: none;
    appearance: none;
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
}
</style>
