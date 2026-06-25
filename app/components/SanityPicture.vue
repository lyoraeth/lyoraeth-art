<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src:      string | null | undefined
  alt:      string
  width?:   number
  height?:  number
  quality?: number
  loading?: 'lazy' | 'eager'
}>(), {
  quality: 80,
  loading: 'lazy',
})

function fmt(format: 'avif' | 'webp'): string {
  return sanityFmt(props.src!, format, { w: props.width, q: props.quality })
}

const pictureRef = ref<HTMLPictureElement>()

function fallbackToRaw(img: HTMLImageElement) {
  pictureRef.value?.querySelectorAll('source').forEach(s => s.remove())
  img.src = props.src!
}

function onError(e: Event) {
  fallbackToRaw(e.target as HTMLImageElement)
}

onMounted(() => {
  const img = pictureRef.value?.querySelector('img') as HTMLImageElement | null
  if (img && img.complete && img.naturalWidth === 0 && props.src) {
    fallbackToRaw(img)
  }
})
</script>

<template>
  <!-- display: contents keeps <picture> transparent to layout -->
  <picture v-if="src" ref="pictureRef" style="display: contents">
    <source :srcset="fmt('avif')" type="image/avif">
    <source :srcset="fmt('webp')"  type="image/webp">
    <img :src="src" :alt="alt" :loading="loading" :width="props.width" :height="props.height" v-bind="$attrs" @error="onError">
  </picture>
  <slot v-else name="placeholder" />
</template>
