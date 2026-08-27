<script setup lang="ts">
import type { PostItem } from '../../server/api/posts.get'

/**
 * Post card. Unlike a work card, the title and the excerpt stay put — only the
 * action appears on hover, from the place already held for it.
 */
defineProps<{ item: PostItem }>()

const { t } = useI18n()
const loc = useLoc()
const localePath = useLocalePath()
const formatDate = useFormatDate()

/** Coordinates written once on entry — the fill starts from that point anyway. */
function onPointerEnter(event: PointerEvent) {
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--x', `${event.clientX - rect.left}px`)
  card.style.setProperty('--y', `${event.clientY - rect.top}px`)
}
</script>

<template>
  <article class="post-card" @pointerenter="onPointerEnter">
    <span class="post-card__fill" aria-hidden="true" />

    <NuxtLink
      :to="localePath(`/writing/${item.slug}`)"
      class="post-card__link"
      :aria-label="loc(item.title)"
    />

    <div class="post-card__header type-ui">
      <p v-if="loc(item.topic)">{{ loc(item.topic) }}</p>
      <p class="post-card__date">{{ formatDate(item.publishedAt, 'medium') }}</p>
    </div>

    <h3 class="post-card__title type-display-md">{{ loc(item.title) }}</h3>

    <div class="post-card__body">
      <p class="type-body-lg">{{ loc(item.excerpt) }}</p>

      <!-- not interactive: the whole card is the link already -->
      <span class="post-card__action type-ui" aria-hidden="true">
        {{ t('writing.read') }}
      </span>
    </div>
  </article>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .post-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 6);
    min-height: calc(var(--spacing) * 80);
    padding: calc(var(--spacing) * 8);
    border-radius: var(--radius-3xl);
    background-color: var(--color-surface-raised);
    overflow: hidden;
  }

  .post-card__fill {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-color: var(--color-fill-strong);
    clip-path: circle(0% at var(--x, 50%) var(--y, 50%));
    transition: clip-path 500ms ease-out;
    pointer-events: none;
  }

  .post-card:hover .post-card__fill {
    clip-path: circle(150% at var(--x, 50%) var(--y, 50%));
  }

  .post-card__link {
    position: absolute;
    inset: 0;
    z-index: 20;
  }

  .post-card__header,
  .post-card__title,
  .post-card__body {
    position: relative;
    z-index: 10;
  }

  /* topic and date — a plain line, no outline unlike the work card's tags */
  .post-card__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    color: var(--color-text-secondary);
    transition: color 500ms var(--ease-base);
  }

  .post-card__title {
    color: var(--color-text-primary);
    transition: color 500ms var(--ease-base);
  }

  .post-card:hover :is(.post-card__header, .post-card__title, .post-card__body) {
    color: var(--color-text-inverse);
  }

  .post-card:hover .post-card__header {
    color: var(--color-text-secondary-inversed);
  }

  /* Takes the rest of the card and splits it: excerpt against the top, action
     against the bottom edge. The action holds its place while hidden, so
     nothing shifts when it appears. */
  .post-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    gap: calc(var(--spacing) * 6);
    color: var(--color-text-primary);
    transition: color 500ms var(--ease-base);
  }

  .post-card__action {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: calc(var(--spacing) * 1.5);
    height: calc(var(--spacing) * 10);
    padding-inline: calc(var(--spacing) * 3);
    border-radius: calc(infinity * 1px);
    background-color: var(--color-surface-hover);
    color: var(--color-text-primary);
    pointer-events: none;

    visibility: hidden;
    opacity: 0;
    translate: 0 -0.25rem;
    transition: opacity 500ms ease-out, translate 500ms ease-out,
                visibility 500ms ease-out;
  }

  .post-card:hover .post-card__action {
    visibility: visible;
    opacity: 1;
    translate: 0 0;
  }
}
</style>
