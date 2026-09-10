<script setup lang="ts">
import {
  MEDIA_FORMATS, MEDIA_MIME, MEDIA_ART_DIRECTION,
  sanityAssetHash, mediaSrcset,
} from '#shared/media'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src:           string | null | undefined
  alt:           string
  /** Responsive `sizes` — the real display width, per usage. */
  sizes:         string
  /** `both` art-directs a 4:3 top crop below 80rem and the source ratio
   *  above (a case study cover). `full` is the source ratio everywhere (a
   *  post cover, the lightbox). */
  family?:       'full' | 'both'
  /** From GROQ `metadata.dimensions` — trims the width ladder to the source
   *  and gives `<img>` an aspect ratio so layout doesn't jump. */
  sourceWidth?:  number | null
  sourceHeight?: number | null
  loading?:      'lazy' | 'eager'
}>(), {
  family:  'full',
  loading: 'lazy',
})

const hash = computed(() => sanityAssetHash(props.src))
// No dimensions → assume the case-study master width, so every rung is
// offered and a missing one just 404s into the <img> fallback below.
const srcWidth = computed(() => props.sourceWidth || 2560)

interface PicSource { media?: string; type: string; srcset: string }

const sources = computed<PicSource[]>(() => {
  const h = hash.value
  if (!h) return []
  const out: PicSource[] = []
  // Art-directed: the source-ratio family wins from 80rem up. Must come
  // first — <picture> takes the first <source> that matches.
  if (props.family === 'both') {
    for (const f of MEDIA_FORMATS) {
      out.push({ media: MEDIA_ART_DIRECTION, type: MEDIA_MIME[f], srcset: mediaSrcset(h, 'full', srcWidth.value, f) })
    }
  }
  const below = props.family === 'both' ? 'cover' : 'full'
  for (const f of MEDIA_FORMATS) {
    out.push({ type: MEDIA_MIME[f], srcset: mediaSrcset(h, below, srcWidth.value, f) })
  }
  return out
})

const pictureRef = ref<HTMLPictureElement>()

// <picture> commits to the first matching <source> and does NOT fall through
// when that resource 404s — a variant the sync task hasn't encoded yet.
// Dropping the <source>s on the img's error hands over to <img src>, the
// Sanity original, which is always there.
function dropSources() {
  pictureRef.value?.querySelectorAll('source').forEach(s => s.remove())
}

onMounted(() => {
  const img = pictureRef.value?.querySelector('img')
  // errored before hydration — the event is long gone, check by hand
  if (img && img.complete && img.naturalWidth === 0 && props.src) dropSources()
})
</script>

<template>
  <!-- display: contents keeps <picture> transparent to layout -->
  <picture v-if="src" ref="pictureRef" style="display: contents">
    <source
      v-for="s in sources"
      :key="(s.media ?? '') + s.type"
      :media="s.media"
      :type="s.type"
      :srcset="s.srcset"
      :sizes="sizes"
    >
    <img
      :src="src"
      :alt="alt"
      :sizes="sizes"
      :width="sourceWidth ?? undefined"
      :height="sourceHeight ?? undefined"
      :loading="loading"
      v-bind="$attrs"
      @error="dropSources"
    >
  </picture>
  <slot v-else name="placeholder" />
</template>
