<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

/** The frame's widths — one file per format per width under /hero/. */
const WIDTHS = [1280, 1920, 2560, 3840]
const srcset = (ext: string) => WIDTHS.map(w => `/hero/hero-${w}.${ext} ${w}w`).join(', ')
</script>

<template>
  <!--
    Two parts: a canvas — the painting across the whole window, with the name
    and the painting's caption on it — and under it a solid strip of the page
    carrying the data and the action. The section leaves the page wrapper for
    the full window; its content goes back onto the site's grid through
    wrappers of its own.
  -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-canvas">
      <!--
        Formats newest to oldest, the browser takes the first it understands —
        the same order and reasoning as the media pipeline. The caption is in
        the text, so the picture itself carries no alt.
      -->
      <picture class="hero-art">
        <source type="image/jxl" :srcset="srcset('jxl')" sizes="100vw">
        <source type="image/avif" :srcset="srcset('avif')" sizes="100vw">
        <source type="image/webp" :srcset="srcset('webp')" sizes="100vw">
        <img
          src="/hero/hero-1920.jpg"
          :srcset="srcset('jpg')"
          sizes="100vw"
          alt=""
          width="3840"
          height="3093"
          fetchpriority="high"
          loading="eager"
        >
      </picture>

      <div class="hero-canvas__text wrapper px-page-padding-x">
        <h1 id="hero-title" class="hero-name type-display-3xl">{{ t('hero.name') }}</h1>
        <p class="hero-credit type-ui">{{ t('hero.credit') }}</p>
      </div>
    </div>

    <!-- the same four columns as every section header below — title, count,
         an empty one, the action — so the hero and the sections share their
         verticals -->
    <div class="hero-band wrapper px-page-padding-x">
      <dl class="hero-cell">
        <dt>{{ t('hero.role_label') }}</dt>
        <dd>{{ t('hero.role') }}</dd>
      </dl>
      <dl class="hero-cell">
        <dt>{{ t('hero.stack_label') }}</dt>
        <dd>{{ t('hero.stack') }}</dd>
      </dl>
      <dl class="hero-cell hero-cell--work">
        <dt>{{ t('hero.work_label') }}</dt>
        <dd>{{ t('hero.work') }}</dd>
      </dl>
      <NuxtLink :to="`${localePath('/')}#contact`" class="hero-cta">
        <span class="hero-cta__label">{{ t('hero.cta_label') }}</span>
        <span class="hero-cta__text">{{ t('hero.cta') }} <span class="hero-cta__arrow" aria-hidden="true">→</span></span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /*
   * Leaves the wrapper for the full window. 100vw counts a classic scrollbar,
   * so the body clips the few pixels it overhangs (see the redesign layout).
   */
  .hero {
    --band-h: 18rem; /* what the strip takes on a phone, roughly */
    margin-inline: calc(50% - 50vw);
  }

  /*
   * The canvas and the strip fill the first screen under the header together:
   * the strip lands on the window's bottom edge. Bounded both ways, so a very
   * short or very tall window doesn't squash or stretch the painting.
   */
  .hero-canvas {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: flex-end;
    height: clamp(22rem, calc(100svh - var(--spacing-header-height) - var(--band-h)), 52rem);
    overflow: hidden;
    background-color: var(--color-fill-strong);
  }

  .hero-art {
    position: absolute;
    inset: 0;
    z-index: -1;
  }
  .hero-art img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 30%;
  }

  .hero-canvas__text {
    display: flex;
    flex-direction: column;
    gap: clamp(1rem, 2vw, 1.75rem);
    padding-block: 0 clamp(1.75rem, 3.5vw, 3.5rem);
  }

  /*
   * The name and the caption are a negative of the painting: a light grey in
   * 'difference' turns dark over light paint and light over dark, so both
   * read on every colour they cross. Grey rather than white — a full white
   * inverts red into a loud cyan; grey keeps the inversion muted.
   */
  .hero-name,
  .hero-credit {
    color: #c4c4c4;
    mix-blend-mode: difference;
  }

  .hero-credit { align-self: flex-end; }

  /* phone: the caption goes to the canvas's top-left, clear of the name in two
     lines; the longest value takes the strip's full width, like the action */
  @media (width < 48rem) {
    .hero-credit {
      position: absolute;
      top: calc(var(--spacing) * 5);
      left: var(--spacing-page-padding-x);
      right: var(--spacing-page-padding-x);
    }
    .hero-cell--work { grid-column: 1 / -1; }
  }

  /* One small tier under the canvas — the footer's label/value pair — so the
     only large thing on the first screen is the name. */
  .hero-band {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--spacing-grid-gap);
    row-gap: calc(var(--spacing) * 7);
    align-items: start;
    padding-block: clamp(1.75rem, 3vw, 2.75rem);
  }

  .hero-cell {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 2);
    padding-right: calc(var(--spacing) * 8);
  }
  .hero-cell dt {
    font-size: var(--text-ui);
    line-height: var(--text-ui--line-height);
    font-weight: var(--text-ui--font-weight);
    color: var(--color-text-secondary);
  }
  .hero-cell dd {
    font-size: var(--text-text);
    line-height: var(--text-text--line-height);
    font-weight: var(--text-text--font-weight);
    color: var(--color-text-primary);
  }

  /*
   * The accent action: a square cell with a label above, a hairline, filled on
   * hover — neither content nor a pill control, a kind of its own, shared only
   * with the contact section's Telegram. Keep the two in step.
   */
  .hero-cta {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: calc(var(--spacing) * 6);
    min-height: calc(var(--spacing) * 26);
    padding: calc(var(--spacing) * 4) calc(var(--spacing) * 5);
    outline: 1px solid var(--color-text-primary);
    outline-offset: -1px;
    color: var(--color-text-primary);
    text-decoration: none;
    transition: background-color var(--duration-hover) var(--ease-out),
                color var(--duration-hover) var(--ease-out);
  }
  .hero-cta:hover {
    background-color: var(--color-fill-strong);
    color: var(--color-text-inverse);
  }
  .hero-cta:active {
    opacity: 0.88;
    transition-duration: var(--duration-press);
  }
  .hero-cta:focus-visible {
    outline: 2px solid var(--color-accent-strong);
    outline-offset: 2px;
  }

  .hero-cta__label {
    font-size: var(--text-ui);
    line-height: var(--text-ui--line-height);
    opacity: 0.7;
  }
  .hero-cta__text {
    font-family: var(--font-display);
    font-size: var(--text-display-lg);
    font-weight: var(--text-display-lg--font-weight);
    line-height: 1.1;
  }
  .hero-cta__arrow {
    display: inline-block;
    transition: translate var(--duration-hover) var(--ease-out);
  }
  .hero-cta:hover .hero-cta__arrow { translate: 0.25rem 0; }

  /* from here exactly the section header's grid: four equal columns, no gap */
  @media (width >= 48rem) {
    .hero { --band-h: 10.5rem; }

    .hero-band {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      column-gap: 0;
    }

    /* pulled up by its own padding: its label lands on the neighbours' line */
    .hero-cta {
      grid-column: 4;
      margin-top: calc(var(--spacing) * -4);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-cta__arrow { transition: none; }
  }
}
</style>
