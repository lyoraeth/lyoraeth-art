<script setup lang="ts">
/**
 * Slim strip above the header — shown only while `siteSettings.notice.enabled`
 * is set, for works on the live site. Non-dismissible: it's meant to stay put
 * until the work is done and the flag goes back off.
 */
defineProps<{ text: string }>()
</script>

<template>
  <div class="site-notice" role="status">{{ text }}</div>
</template>

<style scoped>
/* In the components layer, so utility classes still win elsewhere. */
@layer components {
  .site-notice {
    position: sticky;
    top: 0;
    z-index: 41; /* one above the header */
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--spacing-notice-height);
    padding-inline: var(--spacing-page-padding-x);
    background-color: var(--color-accent-strong);
    color: var(--color-text-inverse);
    font-size: var(--text-ui);
    font-weight: var(--text-ui--font-weight);
    text-align: center;
  }
}
</style>

<style>
/* Not scoped: the sticky header is a sibling and can't read a scoped custom
   property, so the live offset goes on <html> — and only while the strip is
   actually mounted. Everything that has to clear the strip (the header's
   sticky top, scroll-padding) reads var(--notice-h, 0). */
html:has(.site-notice) {
  --notice-h: var(--spacing-notice-height);
}
</style>
