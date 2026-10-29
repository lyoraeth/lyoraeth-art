<script setup lang="ts">
import type { WorkItem } from '../../server/api/work.get'

/**
 * Work card: the case's cover, then a line of stack and year, the title and
 * the teaser. The whole card is the link.
 *
 * Square on purpose. The site's shapes come in three kinds: content (pictures,
 * cards) is square; controls (pills: "See all", "Send", CV) are round; the
 * accent action — the hero's "Get in touch" and the contact section's
 * Telegram — is a square cell of its own.
 *
 * The picture is the work's poster — the client's brand colour and mark, so a
 * row of cards reads as one set — or its cover until it has one. A work with
 * neither (an NDA project) gets a plain dark plate in its
 * place, so a row of cards keeps its rhythm; the plate repeats nothing, the
 * title is right under it.
 */
const props = defineProps<{ item: WorkItem }>()

const loc = useLoc()
const localePath = useLocalePath()
const cardLink = useCardLink(() => `/work/${props.item.slug}`)

/** The design fits three; the CMS holds as many as the project earned. */
const tags = computed(() => (props.item.tags ?? []).slice(0, 3))
const title = computed(() => loc(props.item.title))

/** The poster if the work has one, the case's cover otherwise. */
const picture = computed(() => (props.item.posterUrl
  ? { src: props.item.posterUrl, alt: props.item.posterAlt ?? title.value }
  : props.item.coverUrl ? { src: props.item.coverUrl, alt: props.item.coverAlt ?? title.value } : null))
</script>

<template>
  <article class="work-card" v-on="cardLink">
    <div class="work-card__media">
      <SanityPicture
        v-if="picture"
        :src="picture.src"
        :alt="picture.alt"
        family="full"
        sizes="(min-width: 96rem) 25vw, (min-width: 80rem) 50vw, calc(100vw - 3rem)"
      />
    </div>

    <div class="work-card__meta type-ui">
      <span v-if="tags.length" class="work-card__tags">{{ tags.join(' • ') }}</span>
      <span v-if="item.year">{{ item.year }}</span>
    </div>

    <h3 class="work-card__title type-display-md">
      <NuxtLink :to="localePath(`/work/${item.slug}`)" class="work-card__link">{{ title }}</NuxtLink>
    </h3>

    <p v-if="item.teaser" class="work-card__teaser type-text">{{ loc(item.teaser) }}</p>
  </article>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .work-card {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 2);
    cursor: pointer;
  }

  /* 4:3, cropped from the top: a case cover is a page screenshot, and its
     head is the part that says which site it is */
  .work-card__media {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    /* the picture stands apart from its caption; the caption's lines stay tight */
    margin-bottom: calc(var(--spacing) * 3);
    background-color: var(--color-fill-strong);
  }

  /*
   * The frame: the blog card's hairline, the same colour, gone dark on hover.
   * Drawn on a layer above the picture — an outline on the box itself would
   * sit under the image.
   */
  .work-card__media::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid var(--color-border-raised);
    pointer-events: none;
    transition: border-color var(--duration-hover) var(--ease-out);
  }
  .work-card__media :deep(picture) { display: contents; }
  .work-card__media :deep(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    transition: scale var(--duration-sweep) var(--ease-out);
  }

  .work-card__meta {
    display: flex;
    justify-content: space-between;
    gap: calc(var(--spacing) * 4);
    color: var(--color-text-secondary);
  }

  /* one line: a long stack truncates instead of pushing the year over */
  .work-card__tags {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .work-card__title { color: var(--color-text-primary); }

  .work-card__link {
    color: inherit;
    text-decoration: none;
    transition: color var(--duration-hover) var(--ease-out);
  }

  .work-card__teaser { color: var(--color-text-secondary); }

  /*
   * Hover states only where a pointer can hover. On touch :hover latches after
   * a tap, which would leave a card stuck in its hover state.
   */
  @media (hover: hover) {
    .work-card:hover .work-card__media :deep(img) { scale: 1.03; }
    .work-card:hover .work-card__media::after { border-color: var(--color-fill-strong); }
    .work-card:hover .work-card__link { color: var(--color-accent-strong); }
  }

  /* the keyboard sees what the pointer does, plus the focus ring on the link */
  .work-card:has(.work-card__link:focus-visible) .work-card__media::after { border-color: var(--color-fill-strong); }
  .work-card:has(.work-card__link:focus-visible) .work-card__link { color: var(--color-accent-strong); }
  .work-card__link:focus-visible {
    outline: 2px solid var(--color-accent-strong);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .work-card__media :deep(img) { transition: none; }
  }
}
</style>
