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
  quality: 92,
  loading: 'lazy',
})

function fmt(format: 'avif' | 'webp'): string {
  return sanityFmt(props.src!, format, { w: props.width, q: props.quality })
}

const pictureRef = ref<HTMLPictureElement>()

/* Stepped degradation instead of jumping straight to the untransformed
   original (which can be a multi-megabyte upload): a transient CDN failure on
   the webp transform retries as a size/quality-constrained jpeg first, and
   only a second failure ships the raw file. */
let fallbackStep = 0

function degrade(img: HTMLImageElement) {
  if (!props.src) return
  if (fallbackStep === 0) {
    fallbackStep = 1
    pictureRef.value?.querySelectorAll('source').forEach(s => s.remove())
    img.src = sanityFmt(props.src, 'jpg', { w: props.width, q: props.quality })
  } else if (fallbackStep === 1) {
    fallbackStep = 2
    img.src = props.src
  }
}

function onError(e: Event) {
  degrade(e.target as HTMLImageElement)
}

onMounted(() => {
  const img = pictureRef.value?.querySelector('img') as HTMLImageElement | null
  if (!img || !img.complete) return
  if (img.naturalWidth === 0 && props.src) {
    // errored before hydration — the error event is long gone, re-run the chain
    degrade(img)
  } else if (img.naturalWidth > 0) {
    img.dispatchEvent(new Event('load'))
  }
})
</script>

<template>
  <!-- display: contents keeps <picture> transparent to layout -->
  <picture v-if="src" ref="pictureRef" style="display: contents">
    <source :srcset="fmt('webp')" type="image/webp">
    <img :src="src" :alt="alt" :loading="loading" :width="props.width" :height="props.height" v-bind="$attrs" @error="onError">
  </picture>
  <slot v-else name="placeholder" />
</template>
