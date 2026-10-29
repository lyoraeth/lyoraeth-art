<script setup lang="ts">
import type { ProjectItem } from '../../server/api/project.get'

/**
 * One project as a showcase row rather than a card: the screenshot at full
 * source ratio beside the text, a stack of rows down the page. It deliberately
 * has none of the card vocabulary (fill sweep, hover swap, whole-block link) —
 * Work and Writing already speak that, and a third grid of the same cards
 * reads as filler. The only hover states are the links themselves.
 */
const props = defineProps<{ item: ProjectItem }>()

const loc = useLoc()
const localePath = useLocalePath()

const landing = computed(() => localePath(`/projects/${props.item.slug}`))
const title = computed(() => loc(props.item.title))
</script>

<template>
  <article class="project-showcase layout-grid gap-grid-gap">
    <!-- decorative duplicate of the title link below — kept out of the tab
         order and the accessibility tree so a project isn't announced twice -->
    <NuxtLink
      v-if="item.coverUrl"
      :to="landing"
      class="project-showcase__media col-span-4 md:col-span-8 xl:col-span-7"
      tabindex="-1"
      aria-hidden="true"
    >
      <SanityPicture
        :src="item.coverUrl"
        :alt="item.coverAlt ?? title"
        family="full"
        :source-width="item.coverWidth"
        :source-height="item.coverHeight"
        sizes="(min-width: 80rem) 52vw, calc(100vw - 3rem)"
      />
    </NuxtLink>

    <!-- no cover: no empty box in its place, the text takes the wider column -->
    <div class="project-showcase__body col-span-4 md:col-span-8" :class="item.coverUrl ? 'xl:col-span-5' : 'xl:col-span-7'">
      <span v-if="item.year" class="project-showcase__year type-ui">{{ item.year }}</span>

      <div class="project-showcase__heading">
        <ProjectMark v-if="item.logoUrl" :src="item.logoUrl" class="project-showcase__mark" />
        <h3 class="project-showcase__title text-text-primary">
          <NuxtLink :to="landing" class="project-showcase__title-link">{{ title }}</NuxtLink>
        </h3>
      </div>

      <p v-if="item.teaser" class="type-body-lg text-text-primary">{{ loc(item.teaser) }}</p>
      <p v-if="item.excerpt" class="type-text text-text-secondary">{{ loc(item.excerpt) }}</p>

      <div v-if="item.tags?.length" class="project-showcase__tags type-ui">
        <span class="project-showcase__tags-text">{{ item.tags.join(' • ') }}</span>
      </div>

      <ProjectLinks :item="item" class="project-showcase__links" />
    </div>
  </article>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .project-showcase {
    align-items: center;
    row-gap: calc(var(--spacing) * 6);
  }

  /* Stacked rows: a rule and a section-sized gap between them, no card edges. */
  .project-showcase + .project-showcase {
    padding-top: var(--spacing-section-header-gap);
    border-top: 1px solid var(--color-border-default);
  }

  /* Framed like a case cover: the same radius and hairline, the image itself
     left uncropped so the screenshot reads as the real window it is. */
  .project-showcase__media {
    display: block;
    overflow: hidden;
    border-radius: var(--radius-3xl);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-raised);
  }

  .project-showcase__media :deep(img) {
    display: block;
    width: 100%;
    height: auto;
  }

  .project-showcase__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--spacing) * 4);
  }

  .project-showcase__heading {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 4);
  }

  .project-showcase__mark { --project-mark-size: calc(var(--spacing) * 12); }

  /* Larger than the card titles of Work and Writing: a project is the page's
     subject, not one entry in a grid. A fixed size, not fluid. */
  .project-showcase__title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: var(--text-display-lg--font-weight);
    line-height: var(--text-display-lg--line-height);
    letter-spacing: var(--text-display-lg--letter-spacing);
  }

  .project-showcase__year { color: var(--color-text-secondary); }

  .project-showcase__title-link {
    color: inherit;
    text-decoration: none;
    transition: color var(--duration-hover) var(--ease-out);
  }
  .project-showcase__title-link:hover { color: var(--color-accent-strong); }

  /* One outlined pill with the stack joined by bullets — the same tag line a
     work card has. Capped to the column: a long stack truncates instead of
     wrapping. */
  .project-showcase__tags {
    display: flex;
    max-width: 100%;
    padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 2);
    border-radius: calc(infinity * 1px);
    outline: 1px solid var(--color-border-raised);
    color: var(--color-text-secondary);
  }
  .project-showcase__tags-text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .project-showcase__links { margin-top: calc(var(--spacing) * 2); }
}
</style>
