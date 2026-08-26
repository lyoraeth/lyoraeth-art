<script setup lang="ts">
import type { WorkItem } from '../../server/api/work.get'

const props = defineProps<{
  item:    WorkItem
  index:   number
  reverse: boolean
}>()

const loc = useLoc()

const cardRef = ref<HTMLElement | null>(null)

useGlowCard(cardRef)

onMounted(() => {
  if (!cardRef.value) return
  const io = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    ;(entry.target as HTMLElement).classList.add('in')
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
    <div class="card-body">
      <p class="eyebrow card-teaser">{{ loc(item.teaser) }}</p>
      <h3 class="card-title">{{ loc(item.title) }}</h3>
      <p class="card-desc">{{ loc(item.excerpt) || loc(item.teaser) }}</p>
      <div class="card-tags">
        <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>

    <div class="card-divider" aria-hidden="true"></div>

    <div class="card-viewport">
      <div class="viewport-media">
        <SanityPicture
          :src="item.coverUrl"
          :alt="item.coverAlt ?? loc(item.title)"
          class="viewport-img"
          loading="eager"
          draggable="false"
          :width="700"
        >
          <template #placeholder>
            <!-- FPO sheet — print-production placeholder, see lyoaeth-brand/placeholders -->
            <img src="/placeholders/work.svg" alt="" class="viewport-img" aria-hidden="true" draggable="false" />
          </template>
        </SanityPicture>
      </div>
    </div>
  </article>
</template>

<style scoped>
.work-card {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: stretch;
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

/* Divider — a single masked container (no native `border`) so the static line and
   its hover glow share one clip and can't drift apart into a stepped double-edge.
   Trimmed 1px top/bottom so it doesn't overlap the outer ring's horizontal runs. */
.card-divider {
  position: absolute;
  inset: 1px 0;
  pointer-events: none;
  z-index: 3;
  background: var(--line-soft);
  -webkit-mask: linear-gradient(to right, transparent calc(52.5% - 0.5px), #fff calc(52.5% - 0.5px), #fff calc(52.5% + 0.5px), transparent calc(52.5% + 0.5px));
  mask: linear-gradient(to right, transparent calc(52.5% - 0.5px), #fff calc(52.5% - 0.5px), #fff calc(52.5% + 0.5px), transparent calc(52.5% + 0.5px));
}
.work-card--reverse .card-divider {
  -webkit-mask: linear-gradient(to right, transparent calc(47.5% - 0.5px), #fff calc(47.5% - 0.5px), #fff calc(47.5% + 0.5px), transparent calc(47.5% + 0.5px));
  mask: linear-gradient(to right, transparent calc(47.5% - 0.5px), #fff calc(47.5% - 0.5px), #fff calc(47.5% + 0.5px), transparent calc(47.5% + 0.5px));
}
/* Cursor-tracked glow, nested so it inherits the parent's mask/clip for free
   (--gx/--gy from useGlowCard on cardRef) — only lights up when the cursor is
   actually near it, like a continuation of the ring rather than a separate
   effect tied to "hovering the card at all". */
.card-divider::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(16rem circle at var(--gx, 50%) var(--gy, 50%), oklch(72% 0.1 58 / 90%), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s var(--ease-silk);
}
.work-card:hover .card-divider::after {
  opacity: 1;
}
@media (max-width: 47.5em) {
  .card-divider { display: none; }
}
.card-teaser { margin-bottom: auto; }
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
  background: rgba(255, 255, 255, 0.02);
  background: oklch(100% 0 0 / 2%);
}
.tag--warm {
  color: var(--ember);
  border-color: var(--ember-border);
  background: var(--ember-bg);
}

.card-viewport {
  position: relative;
  overflow: hidden;
  z-index: 2;
  background: linear-gradient(135deg, #0c1016, #0a0d12);
}

/* Sunk 1px on the 3 sides touching the card's own border (so it shows through
   unbroken) — flush against the divider, which already separates it from the text.
   Radius nudged in by the same 1px so the corner stays concentric with the card. */
@media (min-width: 47.5em) {
  .work-card:not(.work-card--reverse) .card-viewport {
    margin: 1px 1px 1px 0;
    border-radius: 0 calc(var(--radius-card) - 1px) calc(var(--radius-card) - 1px) 0;
  }
  .work-card--reverse .card-viewport {
    margin: 1px 0 1px 1px;
    border-radius: calc(var(--radius-card) - 1px) 0 0 calc(var(--radius-card) - 1px);
  }
}

@media (max-width: 47.5em) {
  .card-viewport {
    min-height: 12.5rem;
    margin: 1px;
  }
}
.viewport-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.viewport-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
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
