<script setup lang="ts">
const { t }           = useI18n()
const localePath      = useLocalePath()
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="footer-copy">{{ t('footer.copyright') }}</span>
        <NuxtLink :to="localePath('/privacy')" class="footer-link">{{ t('footer.privacy') }}</NuxtLink>
      </div>
      <span class="footer-hint">{{ t('footer.hint') }}</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  z-index: 2;
  border-top: 1px solid var(--line-soft);
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.625rem clamp(1.25rem, 0.1538rem + 4.8718vw, 6rem);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 1.125rem;
  flex-wrap: wrap;
}

.footer-copy {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--faint);
}

.footer-link {
  color: var(--mist);
  text-decoration: none;
  font-size: 0.78125rem;
  transition: color 0.25s var(--ease-silk);
}

.footer-link:hover {
  color: var(--ember);
}

.footer-hint {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--faint);
}
</style>
