<script setup lang="ts">
import type { WorkItem } from '../../server/api/work.get'

/**
 * Work card. At rest it shows the teaser; on hover a fill sweeps out from the
 * pointer and the excerpt takes the teaser's place.
 */
const props = defineProps<{ item: WorkItem }>()

const { t } = useI18n()
const loc = useLoc()
const localePath = useLocalePath()
const onCardClick = useCardLink(() => `/work/${props.item.slug}`)

/** The design fits three; the CMS holds as many as the project earned. */
const tags = computed(() => (props.item.tags ?? []).slice(0, 3))

/*
 * The fill spreads as a circle from wherever the pointer entered. Coordinates
 * are written once on entry — the circle starts from that point regardless, so
 * there is nothing to recompute on every move.
 */
function onPointerEnter(event: PointerEvent) {
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--x', `${event.clientX - rect.left}px`)
  card.style.setProperty('--y', `${event.clientY - rect.top}px`)
}
</script>

<template>
  <article class="work-card" @pointerenter="onPointerEnter" @click="onCardClick">
    <span class="work-card__fill" aria-hidden="true" />

    <div class="work-card__header">
      <div v-if="tags.length" class="work-card__tags type-ui">
        <span v-for="tag in tags" :key="tag">{{ tag }}</span>
      </div>
      <p v-if="item.year" class="work-card__date type-ui">{{ item.year }}</p>
    </div>

    <h3 class="work-card__title type-display-md">
      <NuxtLink :to="localePath(`/work/${item.slug}`)" class="work-card__link">
        {{ loc(item.title) }}
      </NuxtLink>
    </h3>

    <div class="work-card__stack">
      <div class="work-card__state work-card__state--short">
        <p class="type-body-lg">{{ loc(item.teaser) }}</p>
      </div>

      <div class="work-card__state work-card__state--full">
        <p class="type-body-lg">{{ loc(item.excerpt) }}</p>

        <!-- not interactive: the whole card is the link, a second target would
             only get in the way -->
        <span class="work-card__action type-ui" aria-hidden="true">
          <span>{{ t('work.view_case') }}</span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /*
   * Cards are all as tall as the tallest one and never shorter than 320px: the
   * grid's auto-rows-fr does the levelling, min-height sets the floor.
   *
   * Hovering doesn't move the height — both states share one cell of the inner
   * grid and swap by visibility, so the card always occupies the taller one.
   */
  .work-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 6);
    min-height: calc(var(--spacing) * 80);
    padding: calc(var(--spacing) * 8);
    border-radius: var(--radius-3xl);
    background-color: var(--color-surface-raised);
    overflow: hidden;
    cursor: pointer;
  }

  .work-card__fill {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-color: var(--color-fill-strong);
    clip-path: circle(0% at var(--x, 50%) var(--y, 50%));
    transition: clip-path 500ms ease-out;
    pointer-events: none;
    /* decoration — never part of what gets selected */
    user-select: none;
  }

  .work-card:hover .work-card__fill {
    clip-path: circle(150% at var(--x, 50%) var(--y, 50%));
  }

  .work-card__link {
    color: inherit;
    text-decoration: none;
  }

  .work-card__header,
  .work-card__title,
  .work-card__stack {
    position: relative;
    z-index: 10;
  }

  .work-card__header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .work-card__tags {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: calc(var(--spacing) * 3.75);
    padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 2);
    border-radius: calc(infinity * 1px);
    outline: 1px solid var(--color-border-raised);
    color: var(--color-text-secondary);
    transition: color 500ms var(--ease-base), outline-color 500ms var(--ease-base);

    /* separator drawn by a pseudo-element rather than typed into the text */
    & span + span::before {
      content: '•';
      margin-right: calc(var(--spacing) * 3.75);
    }
  }

  .work-card__date {
    color: var(--color-text-secondary);
    transition: color 500ms var(--ease-base);
  }

  .work-card__title {
    color: var(--color-text-primary);
    transition: color 500ms var(--ease-base);
  }

  .work-card:hover :is(.work-card__tags, .work-card__date) {
    color: var(--color-text-secondary-inversed);
  }

  .work-card:hover .work-card__tags {
    outline-color: var(--color-border-raised-inversed);
  }

  .work-card:hover .work-card__title {
    color: var(--color-text-inverse);
  }

  .work-card__stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    margin-top: auto;
  }

  .work-card__state {
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    transition: opacity 500ms ease-out, translate 500ms ease-out,
                visibility 500ms ease-out;
  }

  .work-card__state--short {
    justify-content: flex-end;
    color: var(--color-text-primary);
  }

  .work-card__state--full {
    align-items: flex-start;
    gap: calc(var(--spacing) * 6);
    color: var(--color-text-inverse);
    visibility: hidden;
    opacity: 0;
    translate: 0 -0.25rem;
    pointer-events: none;
  }

  .work-card:hover .work-card__state--short {
    visibility: hidden;
    opacity: 0;
    translate: 0 0.25rem;
    pointer-events: none;
  }

  .work-card:hover .work-card__state--full {
    visibility: visible;
    opacity: 1;
    translate: 0 0;
    pointer-events: auto;
  }

  .work-card__action {
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
  }
}
</style>
