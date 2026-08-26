<script setup lang="ts">
/**
 * Site-wide notice while the CMS is being reworked. Deliberately self-contained:
 * no CMS data, no assets — it has to keep standing while everything it would
 * otherwise depend on is in flux.
 */
const { t } = useI18n()
</script>

<template>
  <div class="notice">{{ t('maintenance.notice') }}</div>
</template>

<style>
:root {
  /* the fixed nav and the page top offset both read this */
  --notice-h: 2.25rem;
}

.notice {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  height: var(--notice-h);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background: var(--ember);
  color: var(--void);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-align: center;
}
</style>
