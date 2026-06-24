<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src:      string | null | undefined
  alt:      string
  width?:   number
  quality?: number
  loading?: 'lazy' | 'eager'
}>(), {
  quality: 80,
  loading: 'lazy',
})

function fmt(format: 'avif' | 'webp'): string {
  return sanityFmt(props.src!, format, { w: props.width, q: props.quality })
}
</script>

<template>
  <!-- display: contents keeps <picture> transparent to layout -->
  <picture v-if="src" style="display: contents">
    <source :srcset="fmt('avif')" type="image/avif">
    <source :srcset="fmt('webp')"  type="image/webp">
    <img :src="src" :alt="alt" :loading="loading" v-bind="$attrs">
  </picture>
  <slot v-else name="placeholder" />
</template>
