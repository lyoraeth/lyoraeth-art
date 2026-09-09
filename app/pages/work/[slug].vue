<script setup lang="ts">
import type { WorkDetail } from '../../../server/api/work/[slug].get'

definePageMeta({ layout: 'redesign' })

const { t }      = useI18n()
const loc        = useLoc()
const localePath = useLocalePath()
const route      = useRoute()
const slug       = route.params.slug as string

const { data: item } = await useFetch<WorkDetail | null>(`/api/work/${slug}`)

if (!item.value) {
  throw createError({ statusCode: 404, statusMessage: 'Work item not found' })
}

const title = computed(() => loc(item.value?.title))

const bodyParagraphs = computed(() =>
  (loc(item.value?.body) ?? '').split(/\n\n+/).filter(Boolean),
)

const metaDescription = computed(() =>
  loc(item.value?.excerpt) || loc(item.value?.teaser),
)

const { ogImage, pageUrl } = useArticleSeo({
  type:        'work',
  title:       () => title.value,
  description: () => metaDescription.value,
  coverUrl:    () => item.value?.coverUrl,
  coverWidth:  () => item.value?.coverWidth,
  coverHeight: () => item.value?.coverHeight,
  coverAlt:    () => item.value?.coverAlt,
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: title.value,
      description: metaDescription.value,
      url: pageUrl.value,
      ...(item.value?.coverUrl && { image: ogImage.value }),
      // References the one Person node app.vue defines, rather than
      // repeating a copy of it here.
      author: { '@id': 'https://lyoraeth.art/#person' },
    })),
  }, {
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'),   item: `https://lyoraeth.art${localePath('/')}` },
        { '@type': 'ListItem', position: 2, name: t('nav.work'),   item: `https://lyoraeth.art${localePath('/work')}` },
        { '@type': 'ListItem', position: 3, name: title.value,     item: pageUrl.value },
      ],
    })),
  }],
})

/* ── Analytics: case-study funnel ── */
const track = useTrack()
const { depthEl, endEl } = useCaseStudyFunnel(slug)

/* ── Cover lightbox ──
   Below xl the cover is cropped to 4/3 to line up with the text column;
   the lightbox is how the actual, uncropped image — whatever shape it
   really is — stays reachable at every width, not just at xl where the
   grid already shows it uncropped.

   Opens fit-to-screen; clicking the image widens it to the screen's own
   width (see .work-lightbox__img--zoomed) rather than its full resolution
   — past that, pinch-zoom (touch) or the trackpad (desktop) already cover
   it, and a custom zoom wider than the screen has nowhere to pan without a
   scrollable backdrop, which reads as broken rather than as a feature.
   Resets on every open, so a previous zoom never carries over. */
const lightboxOpen = ref(false)
const imageZoomed  = ref(false)
const coverButton  = ref<HTMLButtonElement | null>(null)
const closeButton  = ref<HTMLButtonElement | null>(null)

// aria-modal="true" claims modal behaviour; without moving focus in and back
// out, keyboard/screen-reader users got none of it — Tab still walked
// through whatever the backdrop covers, and closing left focus on nothing
// in particular (the trigger button, still in the DOM, but never reclaimed).
// useMainInert covers the other half of that same claim: Tab could still
// reach the page content behind the backdrop, not just skip past it.
useMainInert(lightboxOpen)

watch(lightboxOpen, async open => {
  if (open) {
    await nextTick()
    closeButton.value?.focus()
  }
  else {
    imageZoomed.value = false
    coverButton.value?.focus()
  }
})

function onLightboxKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !lightboxOpen.value) return
  lightboxOpen.value = false
}

onMounted(() => {
  document.addEventListener('keydown', onLightboxKeydown)
  onUnmounted(() => document.removeEventListener('keydown', onLightboxKeydown))
})
</script>

<template>
  <div v-if="item" class="flex flex-col gap-y-section-gap py-section-padding-y">
    <div class="flex items-center justify-between flex-wrap gap-x-6 gap-y-2">
      <NuxtLink :to="localePath('/work')" class="post-nav-link">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ t('work.title') }}
      </NuxtLink>

      <div v-if="item.prev || item.next" class="flex items-center gap-5">
        <NuxtLink
          v-if="item.prev"
          :to="localePath(`/work/${item.prev.slug}`)"
          class="post-nav-link"
          :aria-label="`${t('work.prev_project')}: ${loc(item.prev.title)}`"
          :title="loc(item.prev.title)"
        >
          <span aria-hidden="true">←</span>
          <span>{{ t('work.prev_project') }}</span>
        </NuxtLink>
        <NuxtLink
          v-if="item.next"
          :to="localePath(`/work/${item.next.slug}`)"
          class="post-nav-link"
          :aria-label="`${t('work.next_project')}: ${loc(item.next.title)}`"
          :title="loc(item.next.title)"
        >
          <span>{{ t('work.next_project') }}</span>
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Image left, text right — five of twelve columns for the cover, the
         sixth left empty, the text taking the last six. Below xl the cover
         moves above the text instead of sharing a row with it. Without a
         cover there's nothing to sit beside, so the text falls back to the
         same centred column as the blog post and the legal pages. -->
    <div class="layout-grid gap-grid-gap">
      <button
        v-if="item.coverUrl"
        ref="coverButton"
        type="button"
        class="col-span-4 md:col-span-8 xl:col-span-5 xl:self-start post-column work-cover"
        :aria-label="item.coverAlt ?? title"
        @click="lightboxOpen = true"
      >
        <SanityPicture
          :src="item.coverUrl"
          :alt="item.coverAlt ?? title"
          loading="eager"
          fetchpriority="high"
          :width="900"
        />
      </button>

      <article
        class="col-span-4 md:col-span-8 min-w-0"
        :class="item.coverUrl ? 'xl:col-start-7 xl:col-span-6' : 'xl:col-start-4 xl:col-span-6'"
      >
        <div class="post-column work-text" :class="{ 'work-text--flush': item.coverUrl }">
          <header class="flex flex-col gap-6 mb-10">
            <div class="flex items-center gap-2.5 type-ui text-text-secondary">
              <span>{{ loc(item.teaser) }}</span>
              <template v-if="item.year">
                <span aria-hidden="true">·</span>
                <span>{{ item.year }}</span>
              </template>
            </div>
            <h1 class="type-display-2xl text-text-primary">{{ title }}</h1>
            <div v-if="item.tags?.length" class="flex flex-wrap gap-2">
              <span v-for="tag in item.tags" :key="tag" class="tag-pill">{{ tag }}</span>
            </div>
          </header>

          <div class="post-body">
            <span ref="depthEl" aria-hidden="true" />
            <p v-for="(para, i) in bodyParagraphs" :key="i">{{ para }}</p>
            <span ref="endEl" aria-hidden="true" />
          </div>

          <a
            v-if="item.showLink && item.url"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="work-external-link type-ui"
            @click="track(EV.workLink, { slug })"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 13L13 3M13 3H7M13 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ t('work.view_project') }}
          </a>
        </div>
      </article>
    </div>

    <!-- Full view of the cover — reachable at every width, not only where
         the grid already shows it uncropped. Always the real aspect ratio,
         letterboxed rather than filled, since the point is to see the whole
         image rather than fill the screen with it. -->
    <Teleport v-if="item.coverUrl" to="body">
      <Transition name="lightbox">
        <div
          v-if="lightboxOpen"
          class="work-lightbox"
          :class="{ 'work-lightbox--zoomed': imageZoomed }"
          role="dialog"
          aria-modal="true"
          :aria-label="item.coverAlt ?? title"
          @click.self="lightboxOpen = false"
        >
          <button
            ref="closeButton"
            type="button"
            class="work-lightbox__close"
            :aria-label="t('a11y.close')"
            @click="lightboxOpen = false"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>

          <figure class="work-lightbox__figure">
            <SanityPicture
              :src="item.coverUrl"
              :alt="item.coverAlt ?? title"
              :width="2400"
              class="work-lightbox__img"
              :class="{ 'work-lightbox__img--zoomed': imageZoomed }"
              @click="imageZoomed = !imageZoomed"
            />
            <figcaption v-if="item.coverAlt" class="work-lightbox__caption type-ui">
              {{ item.coverAlt }}
            </figcaption>
          </figure>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .tag-pill {
    display: inline-flex;
    align-items: center;
    height: calc(var(--spacing) * 7);
    padding-inline: calc(var(--spacing) * 3);
    border-radius: calc(infinity * 1px);
    background-color: var(--color-surface-hover);
    color: var(--color-text-secondary);
    font-size: var(--text-ui);
  }

  /*
   * Width and centring are .post-column (design-system.css) — below xl,
   * cropped to 4/3 on top of that so it lines up with the text as a stack;
   * at xl both the crop and .post-column's own cap come off (see the
   * override below) — full column width, real aspect ratio, tall or wide,
   * whatever the image actually is. It's a <button>, not a <div>: the whole
   * point below is that clicking it opens the uncropped original, so plain
   * button chrome is reset rather than styled. font: inherit resets a
   * button's own default font wholesale, so .post-column's font-size has to
   * be repeated after it — that shorthand would otherwise win it back.
   */
  .work-cover {
    display: block;
    font: inherit;
    font-size: var(--text-body-lg);
    padding: 0;
    border: none;
    border-radius: var(--radius-3xl);
    outline: 1px solid var(--color-border-default);
    background: none;
    overflow: hidden;
    cursor: zoom-in;
  }

  .work-cover :deep(img) {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    /* top rather than centre — whatever the crop cuts, it cuts from the
       bottom, not evenly off both ends */
    object-position: center top;
  }

  @media (width >= 80rem) {
    .work-cover {
      max-width: none;
      margin-inline: 0;
    }

    .work-cover :deep(img) {
      aspect-ratio: auto;
      height: auto;
    }
  }

  .work-external-link {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--spacing) * 1.5);
    margin-top: calc(var(--spacing) * 2);
    color: var(--color-text-secondary);
    transition: color var(--duration-hover) var(--ease-out);
  }

  .work-external-link:hover {
    color: var(--color-accent-strong);
  }

  .work-external-link svg {
    width: calc(var(--spacing) * 3.5);
    height: calc(var(--spacing) * 3.5);
    flex-shrink: 0;
  }

  /* ── Cover lightbox ── */
  .work-lightbox {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 4);
    padding: calc(var(--spacing) * 6);
    background-color: oklch(15% 0.01 250 / 88%);
    overflow: auto;
  }

  /*
   * Zoomed never grows past the lightbox's own width (see .work-lightbox__
   * img--zoomed), so the cross axis never overflows — only vertical can,
   * for a tall image at full width. justify-content still switches to
   * flex-start for that axis: centred flex alignment clips whatever
   * overflows before the start edge (a browser quirk, not a choice), which
   * left the top of a tall zoomed image unreachable by scrolling.
   */
  .work-lightbox--zoomed {
    justify-content: flex-start;
    padding-inline: calc(var(--spacing) * 2);
  }

  .work-lightbox__close {
    position: fixed;
    top: calc(var(--spacing) * 6);
    right: calc(var(--spacing) * 6);
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--spacing) * 10);
    height: calc(var(--spacing) * 10);
    border-radius: calc(infinity * 1px);
    outline: 1px solid oklch(100% 0 0 / 20%);
    background-color: oklch(100% 0 0 / 8%);
    color: var(--color-text-inverse);
    cursor: pointer;
    transition: background-color var(--duration-hover) var(--ease-out);
  }

  .work-lightbox__close:hover {
    background-color: oklch(100% 0 0 / 16%);
  }

  /* Zoomed, the image runs full-width right behind this button and the
     translucent-on-dark-backdrop tint above has nothing dark left to show
     through — a light photo behind it reads as no button at all. Solid
     instead, so it stays visible regardless of what's behind it. */
  .work-lightbox--zoomed .work-lightbox__close {
    outline: none;
    background-color: var(--color-fill-strong);
  }

  .work-lightbox__close svg {
    width: calc(var(--spacing) * 4);
    height: calc(var(--spacing) * 4);
  }

  .work-lightbox__figure {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--spacing) * 3);
    /* width, not just max-width — a percentage width on the zoomed image
       needs a definite width to resolve against, and .work-lightbox (the
       viewport-pinned parent) is the one definite box in this chain. */
    width: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  .work-lightbox__figure :deep(.work-lightbox__img) {
    display: block;
    max-width: 100%;
    max-height: 80vh;
    width: auto;
    height: auto;
    border-radius: var(--radius-2xl);
    cursor: zoom-in;
  }

  /*
   * Widens to fill the lightbox rather than to the image's full resolution
   * — a zoom that can run wider than the screen has nowhere for the extra
   * width to go, and panning it via a scrollable backdrop reads as broken
   * rather than as a feature. Screen width is the ceiling; a reader after
   * more than that already has pinch-zoom (touch) or the trackpad (desktop)
   * for it. height: auto past that width is exactly why justify-content
   * flips to flex-start above — the whole point is the extra height becomes
   * reachable by an ordinary scroll, not fit back down to compensate.
   */
  .work-lightbox__figure :deep(.work-lightbox__img--zoomed) {
    max-width: 100%;
    max-height: none;
    width: 100%;
    cursor: zoom-out;
  }

  .work-lightbox__caption {
    color: oklch(100% 0 0 / 70%);
    text-align: center;
  }

  /* A real modal, not a hover affordance — --duration-panel-in/out, not
     --duration-hover: entry gets noticed, exit doesn't need to be. */
  .lightbox-enter-active {
    transition: opacity var(--duration-panel-in) var(--ease-out);
  }

  .lightbox-leave-active {
    transition: opacity var(--duration-panel-out) var(--ease-out);
  }

  .lightbox-enter-from,
  .lightbox-leave-to {
    opacity: 0;
  }
}

/*
 * .post-column (design-system.css) covers the cap and the centring; a case
 * with a cover only removes the centring at xl, flush against the column's
 * own start edge instead — that grid is asymmetric by design (image, then
 * text). Without a cover there's no image to read flush against, so the
 * text stays on .post-column's own centred column, same as the blog post.
 */
@media (width >= 80rem) {
  .work-text--flush {
    margin-inline: 0;
  }
}

/* ── Prose (body) — same rules as the blog post's .post-body. ── */
.post-body {
  color: var(--color-text-primary);
  line-height: 1.5;
  hyphens: auto;
  font-kerning: normal;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* Every paragraph indents, lead included — no exceptions. */
:deep(.post-body p) { margin: 0 0 1.25rem; text-indent: 1.5em; }
:deep(.post-body p:last-child) { margin-bottom: 0; }
</style>

<style>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* Global on purpose: the page behind an open lightbox must not scroll. */
  html:has(.work-lightbox) {
    overflow: hidden;
  }
}
</style>
