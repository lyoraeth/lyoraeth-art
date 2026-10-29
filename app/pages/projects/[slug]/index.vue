<script setup lang="ts">
import type { ProjectDetail } from '../../../../server/api/project/[slug].get'

definePageMeta({ layout: 'redesign' })

const { locale, t } = useI18n()
const localePath = useLocalePath()
const loc   = useLoc()
const route = useRoute()
const slug  = route.params.slug as string

const { data: project } = await useFetch<ProjectDetail | null>(`/api/project/${slug}`)

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
}

const title = computed(() => (project.value ? loc(project.value.title) : ''))
const description = computed(() =>
  project.value ? (loc(project.value.excerpt) || loc(project.value.teaser)) : '',
)

const { ogImage, pageUrl } = useArticleSeo({
  type:        'project',
  title:       () => title.value,
  description: () => description.value,
  coverUrl:    () => project.value?.coverUrl,
  coverWidth:  () => project.value?.coverWidth,
  coverHeight: () => project.value?.coverHeight,
  coverAlt:    () => project.value?.coverAlt,
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: title.value,
      description: description.value,
      inLanguage: locale.value === 'ru' ? 'ru-RU' : 'en-US',
      codeRepository: project.value?.repoUrl,
      ...(project.value?.tags?.length && { keywords: project.value.tags.join(', ') }),
      ...(project.value?.coverUrl && { image: ogImage.value }),
      url: pageUrl.value,
      mainEntityOfPage: pageUrl.value,
      author: { '@id': 'https://lyoraeth.art/#person' },
    })),
  }, {
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'),     item: `https://lyoraeth.art${localePath('/')}` },
        { '@type': 'ListItem', position: 2, name: t('nav.projects'), item: `https://lyoraeth.art${localePath('/projects')}` },
        { '@type': 'ListItem', position: 3, name: title.value,       item: pageUrl.value },
      ],
    })),
  }],
})

const { renderPost } = useMarkdown({ gallery: project.value?.gallery })
const rawBody = computed(() => {
  const body = project.value?.body
  if (!body) return ''
  const picked = locale.value === 'ru' ? (body.ru || body.en) : body.en
  return typeof picked === 'string' ? picked : ''
})
const bodyHtml = computed(() => (rawBody.value ? renderPost(rawBody.value) : ''))

/* ── Body <picture> resilience ──
   Same recovery SanityPicture does with a Vue error handler: a gallery image
   is a <picture> of /media/ sources, and <picture> does not fall through when
   its chosen source 404s (a variant the sync task hasn't reached yet). The
   markdown output is a plain string, so the page wires it by hand — on an
   error, drop the <source>s and let <img src> (the Sanity original) take over. */
function guardBodyPictures() {
  for (const img of document.querySelectorAll<HTMLImageElement>('.post-body picture img')) {
    if (img.dataset.guarded) continue
    img.dataset.guarded = '1'
    img.addEventListener('error', () => {
      img.closest('picture')?.querySelectorAll('source').forEach(s => s.remove())
    }, { once: true })
    // errored before this ran (SSR'd, already failed): re-trigger the chain
    if (img.complete && img.naturalWidth === 0) img.closest('picture')?.querySelectorAll('source').forEach(s => s.remove())
  }
}

// animated gallery images: the poster first, the animation once it has loaded
const { animations, upgradePictures } = useAnimatedMedia()
const upgradeBodyPictures = () => upgradePictures(document.querySelector('.post-body') ?? document)
watch(animations, () => nextTick(upgradeBodyPictures))

function wirePictures() {
  guardBodyPictures()
  upgradeBodyPictures()
}

onMounted(() => nextTick(wirePictures))
watch(bodyHtml, () => nextTick(wirePictures))

const { toc, activeId } = useToc({
  markdown:   () => rawBody.value,
  introLabel: () => t('projects.toc_intro'),
  content:    () => bodyHtml.value,
})
</script>

<template>
  <div class="flex flex-col gap-y-section-gap py-section-padding-y">
    <!-- Root stays unconditional, with nothing beside it: a v-if root (or a
         sibling comment/text) makes the page a Fragment, and <NuxtPage>'s
         <Transition mode="out-in"> then leaves it unmounted on a client-side
         navigation. `project` is guaranteed by the 404 throw in setup. -->
    <template v-if="project">
      <!-- Back + prev/next -->
      <div class="flex items-center justify-between flex-wrap gap-x-6 gap-y-2">
        <NuxtLink :to="localePath('/projects')" class="post-nav-link">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ t('projects.back') }}
        </NuxtLink>

        <div v-if="project.prev || project.next" class="flex items-center gap-5">
          <NuxtLink
            v-if="project.prev"
            :to="localePath(`/projects/${project.prev.slug}`)"
            class="post-nav-link"
            :aria-label="`${t('projects.prev_project')}: ${loc(project.prev.title)}`"
            :title="loc(project.prev.title)"
          >
            <span aria-hidden="true">←</span>
            <span>{{ t('projects.prev_project') }}</span>
          </NuxtLink>
          <NuxtLink
            v-if="project.next"
            :to="localePath(`/projects/${project.next.slug}`)"
            class="post-nav-link"
            :aria-label="`${t('projects.next_project')}: ${loc(project.next.title)}`"
            :title="loc(project.next.title)"
          >
            <span>{{ t('projects.next_project') }}</span>
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Centred like an article: two empty columns, a gap, six of text,
           another gap, the TOC in the last two. -->
      <div class="layout-grid gap-grid-gap">
        <article class="col-span-4 md:col-span-8 xl:col-start-4 xl:col-span-6 min-w-0">
          <header class="post-column flex flex-col gap-6 mb-10">
            <span v-if="project.year" class="type-ui text-text-secondary">{{ project.year }}</span>
            <div class="flex items-center gap-4">
              <ProjectMark v-if="project.logoUrl" :src="project.logoUrl" class="project-logo" />
              <h1 class="type-display-2xl text-text-primary">{{ title }}</h1>
            </div>
            <p v-if="project.teaser" class="type-body-lg text-text-secondary">{{ loc(project.teaser) }}</p>
            <div v-if="project.tags?.length" class="flex flex-wrap gap-2">
              <span v-for="tag in project.tags" :key="tag" class="tag-pill">{{ tag }}</span>
            </div>
            <ProjectLinks :item="project" />
          </header>

          <div v-if="project.coverUrl" class="project-cover">
            <SanityPicture
              :src="project.coverUrl"
              :alt="project.coverAlt ?? title"
              family="full"
              :source-width="project.coverWidth"
              :source-height="project.coverHeight"
              sizes="(min-width: 48rem) 41rem, calc(100vw - 3rem)"
              loading="eager"
              fetchpriority="high"
            />
          </div>

          <!-- Below xl — always visible, no border or toggle; the sidebar
               takes over from xl. -->
          <ArticleToc
            v-if="toc.length >= 2"
            :toc="toc"
            :active-id="activeId"
            :label="t('projects.toc')"
            variant="plain"
            class="post-column xl:hidden mb-10"
          />

          <!-- bodyHtml is our own rendered markdown (useMarkdown), not user input -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-if="bodyHtml" class="post-body post-column" v-html="bodyHtml" />
        </article>

        <aside v-if="toc.length >= 2" class="hidden xl:block xl:col-start-11 xl:col-span-2">
          <ArticleToc :toc="toc" :active-id="activeId" :label="t('projects.toc')" />
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .project-logo { --project-mark-size: calc(var(--spacing) * 14); }

  .tag-pill {
    display: inline-flex;
    align-items: center;
    height: calc(var(--spacing) * 8);
    padding-inline: calc(var(--spacing) * 4);
    border-radius: calc(infinity * 1px);
    background-color: var(--color-surface-hover);
    color: var(--color-text-secondary);
    font-size: var(--text-ui);
  }

  .project-cover {
    margin-bottom: calc(var(--spacing) * 10);
    overflow: hidden;
    outline: 1px solid var(--color-border-default);
  }

  .project-cover :deep(img) {
    display: block;
    width: 100%;
    height: auto;
  }
}
</style>
