<script setup lang="ts">
import type { WorkItem } from '../../server/api/work.get'

const props = defineProps<{
  item:    WorkItem
  index:   number
  reverse: boolean
}>()

const loc = useLoc()

const cardRef   = ref<HTMLElement | null>(null)
const tiltReady = ref(false)

useGlowCard(cardRef, tiltReady)

onMounted(() => {
  if (!cardRef.value) return
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    ;(entry.target as HTMLElement).classList.add('in')
    setTimeout(() => { tiltReady.value = true }, 950)
    io.disconnect()
  }, { threshold: 0.12 })
  io.observe(cardRef.value)
})
</script>

<template>
  <article
    ref="cardRef"
    class="work-card glass-card reveal"
    :class="[`rv-d${index + 1}`, { 'work-card--reverse': reverse }]"
  >
    <div class="card-glare">
      <div class="glare-mb"><div class="glare-blob"></div><div class="glare-blob-2"></div></div>
    </div>

    <div class="card-body">
      <p class="eyebrow card-kicker">{{ loc(item.kicker) }}</p>
      <h3 class="card-title">{{ loc(item.title) }}</h3>
      <p class="card-desc">{{ loc(item.description) }}</p>
      <div class="card-tags">
        <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
        <span v-if="item.tagWarm" class="tag tag--warm">{{ item.tagWarm }}</span>
      </div>
    </div>

    <div class="card-viewport">
      <div class="viewport-bar"><i></i><i></i><i></i></div>
      <img
        v-if="item.coverUrl"
        :src="item.coverUrl"
        alt=""
        class="viewport-img"
        loading="lazy"
        draggable="false"
      />
    </div>
  </article>
</template>

<style scoped>
.work-card {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border-radius: var(--radius-card);
}
.work-card--reverse {
  grid-template-columns: 0.95fr 1.05fr;
}
.work-card--reverse .card-body     { order: 2; }
.work-card--reverse .card-viewport { order: 1; }

.card-body {
  padding: clamp(1.5rem, 3vw, 2.5rem);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}
.card-kicker { margin-bottom: auto; }
.card-title {
  font-size: clamp(1.25rem, 0.875rem + 1vw, 1.6875rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  margin: 1.625rem 0 0.75rem;
  line-height: 1.14;
}
.card-desc {
  color: var(--mist);
  font-size: 0.9375rem;
  max-width: 44ch;
}

.card-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
.tag {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--mist);
  padding: 0.3125rem 0.625rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: oklch(100% 0 0 / 2%);
}
.tag--warm {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

.card-viewport {
  position: relative;
  margin: 0.875rem;
  border-radius: var(--radius-viewport);
  overflow: hidden;
  z-index: 2;
  background: linear-gradient(135deg, #0c1016, #0a0d12);
  border: 1px solid var(--line-soft);
  min-height: 15rem;
}
.viewport-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0 0.75rem;
  border-bottom: 1px solid var(--line-soft);
  background: oklch(100% 0 0 / 2%);
  z-index: 2;
}
.viewport-bar i {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--line);
  display: block;
}
.viewport-img {
  position: absolute;
  inset: 1.875rem 0 0;
  width: 100%;
  height: calc(100% - 1.875rem);
  object-fit: cover;
  object-position: top;
  display: block;
}

@media (max-width: 47.5em) {
  .work-card,
  .work-card--reverse {
    grid-template-columns: 1fr;
  }
  .work-card--reverse .card-body,
  .work-card--reverse .card-viewport {
    order: unset;
  }
  .work-card--reverse .card-viewport { order: -1; }
  .card-viewport { min-height: 12.5rem; }
}
</style>
