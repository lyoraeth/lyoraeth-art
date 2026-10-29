<script setup lang="ts">
/**
 * A project's own mark. Decorative: the project's name always sits beside it,
 * so it carries no alt text. Rendered as a plain image — it is usually an SVG,
 * which the media pipeline (raster variants) has nothing to do with.
 */
defineProps<{ src: string }>()
</script>

<template>
  <img :src="src" alt="" class="project-mark" decoding="async">
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* The caller sets the size through --project-mark-size. */
  .project-mark {
    flex: none;
    width: var(--project-mark-size, calc(var(--spacing) * 10));
    height: var(--project-mark-size, calc(var(--spacing) * 10));
    object-fit: contain;
  }
}
</style>
