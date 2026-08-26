<script setup lang="ts">
import type { WorkItem } from '../../server/api/work.get'

defineProps<{
  item: WorkItem
  href: string
}>()

const { t } = useI18n()
const loc   = useLoc()

const cardRef = ref<HTMLElement | null>(null)
useGlowCard(cardRef)
</script>

<template>
  <NuxtLink v-slot="{ navigate, href: resolvedHref }" :to="href" custom>
    <a
      ref="cardRef"
      class="work-compact glass-card"
      :href="resolvedHref"
      @click="navigate"
    >
      <div class="wc-top">
        <span class="eyebrow wc-teaser">{{ loc(item.teaser) }}</span>
      </div>
      <h2 class="wc-title">{{ loc(item.title) }}</h2>
      <p class="wc-desc">{{ loc(item.excerpt) || loc(item.teaser) }}</p>
      <div class="wc-tags">
        <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <span class="wc-link">
        {{ t('work.view_project') }} <span class="wc-arrow">→</span>
      </span>
    </a>
  </NuxtLink>
</template>

<style scoped>
.work-compact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: var(--radius-card-sm);
  text-decoration: none;
  color: inherit;
  transition:
    opacity   var(--duration-reveal) var(--ease-out-expo),
    transform var(--duration-reveal) var(--ease-out-expo);
}

.wc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.wc-teaser { color: var(--faint); }

.wc-title {
  font-size: clamp(1.0625rem, 0.875rem + 0.5vw, 1.3125rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.wc-desc {
  font-size: 0.875rem;
  color: var(--mist);
  line-height: 1.6;
  flex: 1;
}
.wc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  color: var(--mist);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: rgba(255, 255, 255, 0.02);
  background: oklch(100% 0 0 / 2%);
}
.tag--warm {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}
.wc-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--ember);
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}
.wc-arrow {
  display: inline-block;
  transition: transform 0.3s var(--ease-out-expo);
}
.work-compact:hover .wc-arrow { transform: translate(0.2rem, -0.2rem); }
</style>
