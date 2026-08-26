<script setup lang="ts">
import type { PostItem } from '../../../server/api/posts.get'

const { t } = useI18n()
const loc = useLoc()
const localePath = useLocalePath()

const { data: posts } = await useFetch<PostItem[]>('/api/posts', {
  query: { limit: 1 },
  key: 'latest-post',
  default: () => [] as PostItem[],
})

const latest = computed(() => posts.value[0] ?? null)
</script>

<template>
  <!--
    Rows are auto rather than fractions: their height is set by the portrait and
    the text under it. Equal fractions would level the rows to the tallest one,
    and the empty second row would take as much as the portrait.
  -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-intro">
      <hgroup class="flex flex-col gap-hero-heading-gap">
        <h1 id="hero-title" class="type-display-3xl text-text-primary">{{ t('hero.name') }}</h1>
        <p class="flex flex-col gap-hero-subtitle-gap">
          <span class="type-display-lg text-text-secondary">{{ t('hero.role') }}</span>
          <span class="type-display-lg text-text-primary">{{ t('hero.stack') }}</span>
        </p>
      </hgroup>

      <NuxtLink
        :to="`${localePath('/')}#contact`"
        class="py-4 px-9 bg-accent-strong hover:bg-accent-strong-hover active:bg-accent-default w-fit text-text-inverse rounded-full type-cta"
      >
        {{ t('hero.cta') }}
      </NuxtLink>
    </div>

    <!--
      Reference for how images are served across the site.

      The source is a high-resolution png; 1x/2x/3x are derived from the actual
      maximum display size, and each runs through the formats with its own
      compression settings. Sources go newest to oldest — jxl, avif, webp, jpeg:
      the browser takes the first it understands.

      jxl leads deliberately, though on this image it's ~16% heavier than avif:
      it decodes progressively, resolving from a blurred frame on a slow
      connection, where avif waits for the whole file.

      sizes describes the real display width and has to match the CSS: it doesn't
      read var(), and it sets the image's own size as well as which file to pick
      — when the two disagree, the image sticks to the value from sizes.
    -->
    <picture class="hero-portrait">
      <source
        type="image/jxl"
        srcset="/face/face-400.jxl 400w, /face/face-800.jxl 800w, /face/face-1200.jxl 1200w"
        sizes="(min-width: 48rem) 20rem, calc(100vw - 3rem)"
      >
      <source
        type="image/avif"
        srcset="/face/face-400.avif 400w, /face/face-800.avif 800w, /face/face-1200.avif 1200w"
        sizes="(min-width: 48rem) 20rem, calc(100vw - 3rem)"
      >
      <source
        type="image/webp"
        srcset="/face/face-400.webp 400w, /face/face-800.webp 800w, /face/face-1200.webp 1200w"
        sizes="(min-width: 48rem) 20rem, calc(100vw - 3rem)"
      >
      <img
        src="/face/face-800.jpg"
        srcset="/face/face-400.jpg 400w, /face/face-800.jpg 800w, /face/face-1200.jpg 1200w"
        sizes="(min-width: 48rem) 20rem, calc(100vw - 3rem)"
        :alt="t('hero.name')"
        width="400"
        height="500"
        fetchpriority="high"
        loading="eager"
      >
    </picture>

    <aside class="hero-meta" :aria-label="t('hero.about')">
      <p class="type-body-lg text-text-secondary">
        {{ t('hero.meta') }} {{ t('hero.latest') }}
        <!-- inline element: the link runs on with the text instead of starting a line -->
        <NuxtLink
          v-if="latest"
          :to="localePath(`/writing/${latest.slug}`)"
          class="text-text-primary hover:text-accent-strong-hover active:text-accent-default transition-colors"
        >
          {{ loc(latest.title) }}
        </NuxtLink>
      </p>
    </aside>
  </section>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /*
   * Three layouts, collected here rather than spread across four elements as
   * utilities. Read top to bottom, narrow to wide:
   *
   *   < 768     no columns: portrait → intro → text, three rows by content
   *   768…1024  two columns: intro and portrait in the first row, text below
   *             them across the full width, ranged left, no width limit
   *   >= 1024   intro spans both rows on the left; on the right the portrait
   *             and, under it, the text — ranged right and width-limited
   */
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(3, auto);
    column-gap: var(--spacing-grid-gap);
    row-gap: var(--spacing-hero-gap-y);
    padding-block: var(--spacing-section-padding-y);
  }

  .hero-portrait { grid-area: 1 / 1 / 2 / 2; }
  .hero-intro    { grid-area: 2 / 1 / 3 / 2; }
  .hero-meta     { grid-area: 3 / 1 / 4 / 2; }

  .hero-intro {
    display: flex;
    flex-direction: column;
    justify-content: center;
    row-gap: var(--spacing-hero-intro-gap);
    height: 100%;
  }

  /* on a phone the portrait takes the full width, with no height ceiling */
  .hero-portrait img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 5;
    object-fit: cover;
    /* Figma has no radius token for this yet */
    border-radius: 1.75rem;
  }

  @media (width >= 48rem) {
    .hero {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(2, auto);
    }

    .hero-intro    { grid-area: 1 / 1 / 2 / 2; }
    .hero-portrait { grid-area: 1 / 2 / 2 / 3; justify-self: end; width: fit-content; }
    .hero-meta     { grid-area: 2 / 1 / 3 / 3; }

    /* from here the portrait lives by its height ceiling, width follows from it */
    .hero-portrait img {
      width: auto;
      max-height: 25rem;
    }
  }

  @media (width >= 64rem) {
    /* the intro unfolds across both rows, the text moves under the portrait */
    .hero-intro { grid-area: 1 / 1 / 3 / 2; }

    .hero-meta {
      grid-area: 2 / 2 / 3 / 3;
      justify-self: end;
      max-width: 27.5rem;
      text-align: right;
    }
  }

  @media (width >= 80rem) {
    .hero-intro { justify-content: flex-end; }
  }
}
</style>
