<script setup lang="ts">
import type { TocEntry } from '../composables/useToc'

/**
 * The "on this page" list for a long-form page — fed by `useToc`. Two looks of
 * the same list: `sidebar` (sticky, pill rows, tracks the active heading) for
 * the xl column, and `plain` (an in-flow list of underlined links, nothing to
 * track against) for below xl.
 */
withDefaults(defineProps<{
  toc:       TocEntry[]
  activeId:  string
  label:     string
  variant?:  'sidebar' | 'plain'
}>(), { variant: 'sidebar' })
</script>

<template>
  <nav :class="['toc', `toc--${variant}`]" :aria-label="label">
    <span class="toc__label type-ui text-text-secondary">{{ label }}</span>
    <ol class="toc__list">
      <li
        v-for="entry in toc"
        :key="entry.id"
        :class="['toc__item', entry.level === 3 && 'toc__item--h3']"
      >
        <a :href="`#${entry.id}`" class="toc__link" :class="{ active: activeId === entry.id }">{{ entry.text }}</a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .toc__label {
    display: block;
    margin-bottom: calc(var(--spacing) * 2);
  }

  .toc__list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 0.5);
    list-style: none;
  }

  .toc__item--h3 {
    padding-left: calc(var(--spacing) * 3);
  }

  .toc__link {
    display: block;
    padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 2);
    border-radius: var(--radius-2xl);
    font-size: var(--text-ui);
    color: var(--color-text-secondary);
    transition: color var(--duration-hover) var(--ease-out),
                background-color var(--duration-hover) var(--ease-out);
  }

  .toc__link:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-hover);
  }

  /* Ambient — it moves on its own as the page scrolls, not something the
     reader picked, so it stays on the same weight as hover. */
  .toc__link.active {
    color: var(--color-accent-strong);
    background-color: var(--color-surface-hover);
  }

  .toc--sidebar {
    position: sticky;
    top: calc(var(--spacing-header-height) + var(--spacing) * 6);
  }

  /* Below xl the list sits in the flow — nothing to track scroll position
     against, so the pill chrome and the active state come off. */
  .toc--plain .toc__list {
    gap: calc(var(--spacing) * 2);
  }

  .toc--plain .toc__link {
    padding: 0;
    border-radius: 0;
    color: var(--color-accent-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .toc--plain .toc__link:hover,
  .toc--plain .toc__link.active {
    color: var(--color-accent-strong-hover);
    background-color: transparent;
  }
}
</style>
