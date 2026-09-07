<script setup lang="ts">
import type { SearchGroups } from '../composables/useSiteSearch'

/** Grouped live-search results panel — same field, filled in as you type,
 *  shared by the desktop search field and the phone search toggle. */
defineProps<{ groups: SearchGroups }>()
const emit = defineEmits<{ select: [] }>()

const { t } = useI18n()
</script>

<template>
  <div class="search-panel" :aria-label="t('search.label')">
    <template v-if="groups.work.length || groups.writing.length || groups.pages.length">
      <div v-if="groups.work.length" class="search-panel__group">
        <p class="search-panel__group-label type-ui">{{ t('work.title') }}</p>
        <NuxtLink
          v-for="r in groups.work"
          :key="r.key"
          :to="r.href"
          class="search-panel__option"
          @click="emit('select')"
        >
          <span>{{ r.title }}</span>
          <span v-if="r.meta" class="search-panel__meta">{{ r.meta }}</span>
        </NuxtLink>
      </div>

      <div v-if="groups.writing.length" class="search-panel__group">
        <p class="search-panel__group-label type-ui">{{ t('writing.title') }}</p>
        <NuxtLink
          v-for="r in groups.writing"
          :key="r.key"
          :to="r.href"
          class="search-panel__option"
          @click="emit('select')"
        >
          <span>{{ r.title }}</span>
          <span v-if="r.meta" class="search-panel__meta">{{ r.meta }}</span>
        </NuxtLink>
      </div>

      <div v-if="groups.pages.length" class="search-panel__group">
        <p class="search-panel__group-label type-ui">{{ t('search.pages') }}</p>
        <NuxtLink
          v-for="r in groups.pages"
          :key="r.key"
          :to="r.href"
          class="search-panel__option"
          @click="emit('select')"
        >
          <span>{{ r.title }}</span>
        </NuxtLink>
      </div>
    </template>

    <p v-else class="search-panel__empty type-ui">{{ t('search.no_results') }}</p>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .search-panel {
    position: absolute;
    top: calc(100% + calc(var(--spacing) * 2));
    left: 0;
    right: 0;
    z-index: 20;
    overflow: hidden;
    border-radius: var(--radius-2xl);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
    box-shadow: var(--shadow-panel);
  }

  /* Right-anchored and width-capped rather than stretched edge-to-edge: the
     phone toggle sits near the header's right edge, close to the burger, so
     a left:0 panel would run out under it instead of under the field. */
  .search-panel--end {
    left: auto;
    min-width: calc(var(--spacing) * 72);
    max-width: calc(100vw - calc(var(--spacing-page-padding-x) * 2));
  }

  .search-panel__group + .search-panel__group {
    border-top: 1px solid var(--color-border-default);
  }

  .search-panel__group-label {
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 4) calc(var(--spacing) * 1);
    color: var(--color-text-secondary);
  }

  .search-panel__group:last-child .search-panel__option:last-child {
    padding-bottom: calc(var(--spacing) * 3);
  }

  /*
   * No inset fill on hover — the row runs the panel's full width, so the fill
   * meets the panel's own edge instead of sitting inside it as a pill.
   */
  .search-panel__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--spacing) * 3);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 4);
    color: var(--color-text-primary);
    text-decoration: none;
    transition: background-color var(--duration-hover) var(--ease-base);
  }

  .search-panel__option:hover {
    background-color: var(--color-surface-hover);
  }

  .search-panel__meta {
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  .search-panel__empty {
    padding: calc(var(--spacing) * 4);
    color: var(--color-text-secondary);
  }
}
</style>
