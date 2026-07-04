<script setup lang="ts">
import type { PostItem } from '../../server/api/posts.get'

defineProps<{
  post: PostItem
  href: string
}>()

const { t }  = useI18n()
const loc    = useLoc()
const formatDate = useFormatDate()

const rowRef = ref<HTMLElement | null>(null)
useGlowCard(rowRef)
</script>

<template>
  <NuxtLink v-slot="{ navigate, href: resolvedHref }" :to="href" custom>
    <a ref="rowRef" class="post-row glass-card" :href="resolvedHref" @click="navigate">
      <div class="post-row-meta">
        <span class="mono row-date">{{ formatDate(post.publishedAt) }}</span>
        <span class="row-dot"></span>
        <span class="mono row-time">{{ t('writing.min', { n: post.readingTime }) }}</span>
      </div>
      <h2 class="row-title">{{ loc(post.title) }}</h2>
      <div class="row-footer">
        <div class="row-tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <span class="row-read">{{ t('writing.read') }} <span class="row-arrow">→</span></span>
      </div>
    </a>
  </NuxtLink>
</template>

<style scoped>
.post-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-card-sm);
  text-decoration: none;
  color: inherit;
  transition:
    opacity   var(--duration-reveal) var(--ease-out-expo),
    transform var(--duration-reveal) var(--ease-out-expo);
}

.post-row-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--faint);
}
.row-date, .row-time { font-size: 0.65625rem; }
.row-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--faint);
  flex-shrink: 0;
}
.row-title {
  font-size: clamp(1rem, 0.875rem + 0.5vw, 1.25rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.row-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.25rem;
}
.row-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
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
.row-read {
  flex-shrink: 0;
  color: var(--ember);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.row-arrow {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.3s var(--ease-out-expo);
}
.post-row:hover .row-arrow { transform: translateX(0.25rem); }
</style>
