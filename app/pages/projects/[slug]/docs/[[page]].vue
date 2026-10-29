<script setup lang="ts">
import {
  DOCS_REF, parseRepoUrl, docsPages, docsPathMap, classifyDocLink, docLinkTarget, stripLangSwitcher,
  type DocsIndexPayload, type DocsPagePayload,
} from '#shared/docs'
import type { ProjectDetail } from '../../../../../server/api/project/[slug].get'

// One instance per docs page: the sidebar's search state starts clean on each
// page, the mobile menu closes itself, and <NuxtPage>'s transition waits for
// the page's own data like every other route instead of showing the previous
// page's text while the next one loads.
definePageMeta({
  layout: 'redesign',
  key:    route => route.path,
  // The bare /docs address has no page of its own — it is the first one. The
  // redirect lives here, before the page exists: done from setup it had to
  // await the navigation, and on a client-side click the instance was already
  // unmounted (its data cleared) by the time the code after it ran.
  middleware: async to => {
    if (to.params.page) return
    const index = await $fetch<DocsIndexPayload>(`/api/project/${to.params.slug}/docs`).catch(() => null)
    const first = index && docsPages(index).find(p => !p.landing)
    // no index (GitHub unreachable): fall through, the page shows its own notice
    if (first) return navigateTo(`${to.path.replace(/\/$/, '')}/${first.key}`, { replace: true, redirectCode: 302 })
  },
})

const { locale, t } = useI18n()
const localePath = useLocalePath()
const loc = useLoc()
const route = useRoute()
const slug = route.params.slug as string
/** The flat page key from the URL; empty on the bare `/docs` address. */
const requested = (route.params.page as string | undefined) ?? ''

const { data: project } = await useFetch<ProjectDetail | null>(`/api/project/${slug}`)
if (!project.value?.hasDocs) {
  throw createError({ statusCode: 404, statusMessage: 'Docs not found' })
}

const { data: index, error: indexError } = await useFetch<DocsIndexPayload>(`/api/project/${slug}/docs`, {
  key: `docs-index-${slug}`,
})
if (indexError.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Docs not found' })
}

const pages = computed(() => (index.value ? docsPages(index.value).filter(p => !p.landing) : []))
const current = computed(() => pages.value.find(p => p.key === requested) ?? null)

if (index.value && requested && !current.value) {
  throw createError({ statusCode: 404, statusMessage: 'Docs page not found' })
}

const { data: doc, error: docError } = await useAsyncData(
  `docs-page-${slug}-${requested}`,
  () => (current.value ? $fetch<DocsPagePayload>(`/api/project/${slug}/docs/${requested}`) : Promise.resolve(null)),
)
if (docError.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Docs page not found' })
}

/** GitHub couldn't be reached and nothing was cached to serve instead. */
const unavailable = computed(() => !index.value || (!!current.value && !doc.value))

const projectTitle = computed(() => (project.value ? loc(project.value.title) : ''))
/** RU text when the repo has it, EN otherwise — and the path the chosen text
 *  was read from, which is what its relative links are relative to. */
const lang = computed<'en' | 'ru'>(() => (locale.value === 'ru' && doc.value?.body.ru ? 'ru' : 'en'))
const raw = computed(() => (doc.value ? stripLangSwitcher(doc.value.body[lang.value] ?? '') : ''))
const fromPath = computed(() => (doc.value ? (doc.value.path[lang.value] ?? doc.value.path.en) : ''))
const pageTitle = computed(() => (doc.value ? (lang.value === 'ru' && doc.value.title.ru) || doc.value.title.en : ''))

useSeoMeta({
  title:         () => `${pageTitle.value || t('docs.title')} — ${projectTitle.value} — lyoraeth`,
  description:   () => (project.value ? loc(project.value.excerpt) || loc(project.value.teaser) : ''),
  ogTitle:       () => `${pageTitle.value || t('docs.title')} — ${projectTitle.value}`,
  ogDescription: () => (project.value ? loc(project.value.excerpt) || loc(project.value.teaser) : ''),
})

// the version is a nicety: fetched on the client after the page, never in its way
const { data: release } = useFetch<{ tag: string; url: string } | null>(`/api/project/${slug}/release`, {
  key:     `docs-release-${slug}`,
  server:  false,
  lazy:    true,
  default: () => null,
})

const pathMap = computed(() => (index.value ? docsPathMap(index.value) : new Map()))
const repo = parseRepoUrl(project.value.repoUrl)

const { renderPost } = useMarkdown({
  resolveLink: href => docLinkTarget(classifyDocLink(href, fromPath.value, pathMap.value), {
    page:    key => localePath(`/projects/${slug}/docs/${key}`),
    landing: localePath(`/projects/${slug}`),
    repo:    { owner: repo?.owner ?? '', repo: repo?.repo ?? '', ref: DOCS_REF },
  }),
})
const bodyHtml = computed(() => (raw.value ? renderPost(raw.value) : ''))

const { toc, activeId } = useToc({
  markdown:   () => raw.value,
  introLabel: () => pageTitle.value,
  content:    () => bodyHtml.value,
})

const { highlightAll } = useCodeHighlight()
onMounted(() => highlightAll())
// a language switch re-renders the body in place — its code blocks are new
watch(bodyHtml, () => nextTick(() => highlightAll()))
</script>

<template>
  <div class="flex flex-col gap-y-section-gap py-section-padding-y">
    <!-- Root stays unconditional, with nothing beside it: a v-if root (or a
         sibling comment/text) makes the page a Fragment, and <NuxtPage>'s
         <Transition mode="out-in"> then leaves it unmounted on a client-side
         navigation. `project` is guaranteed by the 404 throw in setup. -->
    <template v-if="project">
      <div class="flex items-center justify-between flex-wrap gap-x-6 gap-y-2">
        <NuxtLink :to="localePath(`/projects/${slug}`)" class="post-nav-link">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <ProjectMark v-if="project.logoUrl" :src="project.logoUrl" class="docs-mark" />
          {{ projectTitle }}
        </NuxtLink>

        <!-- where the project stands, and the version to download -->
        <p class="docs-state type-ui">
          <span>{{ t(`projects.status_${project.status}`) }}</span>
          <template v-if="release">
            <span aria-hidden="true">·</span>
            <a :href="release.url" target="_blank" rel="noopener noreferrer" :title="t('docs.release')" class="docs-state__version">{{ release.tag }}</a>
          </template>
        </p>
      </div>

      <!-- Below xl the menu folds into a disclosure above the page; from xl
           it is the left column. -->
      <details v-if="index" class="docs-menu xl:hidden">
        <summary class="type-ui">{{ t('docs.menu') }}</summary>
        <DocsSidebar :index="index" :slug="slug" :current-key="requested" class="docs-menu__body" />
      </details>

      <div class="layout-grid gap-grid-gap">
        <aside v-if="index" class="hidden xl:block xl:col-span-3">
          <div class="docs-aside">
            <DocsSidebar :index="index" :slug="slug" :current-key="requested" />
          </div>
        </aside>

        <article class="col-span-4 md:col-span-8 xl:col-span-6 min-w-0" :class="{ 'xl:col-start-4': !index }">
          <template v-if="unavailable">
            <div class="docs-unavailable post-column">
              <h1 class="type-display-xl text-text-primary">{{ t('docs.unavailable_title') }}</h1>
              <p class="type-body-lg text-text-secondary">{{ t('docs.unavailable_text') }}</p>
              <a :href="project.repoUrl" target="_blank" rel="noopener noreferrer" class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse">
                {{ t('docs.unavailable_repo') }} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </template>

          <template v-else>
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
            <div v-if="bodyHtml" class="post-body docs-body post-column" v-html="bodyHtml" />
          </template>
        </article>

        <aside v-if="!unavailable && toc.length >= 2" class="hidden xl:block xl:col-span-3">
          <ArticleToc :toc="toc" :active-id="activeId" :label="t('projects.toc')" />
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* Sticky inside the grid row, so it stops with the page. Capped to the
     viewport so a long tree scrolls inside the column instead of running
     under the fold. */
  .docs-aside {
    position: sticky;
    top: calc(var(--spacing-header-height) + var(--spacing) * 6);
    max-height: calc(100vh - var(--spacing-header-height) - var(--spacing) * 12);
    overflow-y: auto;
    padding-right: calc(var(--spacing) * 2);
  }

  .docs-mark { --project-mark-size: calc(var(--spacing) * 5); }

  .docs-menu {
    border-radius: var(--radius-2xl);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
  }

  .docs-menu summary {
    padding: calc(var(--spacing) * 3) calc(var(--spacing) * 4);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .docs-menu__body {
    padding: calc(var(--spacing) * 1) calc(var(--spacing) * 4) calc(var(--spacing) * 4);
  }

  .docs-unavailable {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--spacing) * 4);
  }

  .docs-state {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
    color: var(--color-text-secondary);
  }
  .docs-state__version {
    color: inherit;
    text-decoration: none;
    transition: color var(--duration-hover) var(--ease-out);
  }
  .docs-state__version:hover { color: var(--color-text-primary); }
}

/* Reference text, not an essay: the blog's indented paragraphs are a
   typographic voice that doesn't suit a manual. */
:deep(.docs-body p) { text-indent: 0; }

/* The page title is the markdown's own h1, so it sits inside the prose where
   nothing styles it (a blog post's title lives outside the body). Same
   display scale as every other page title. */
:deep(.docs-body h1) {
  margin: 0 0 1.5rem;
  color: var(--color-text-primary);
  font-family: var(--font-display);
  font-size: var(--text-display-2xl);
  font-weight: var(--text-display-2xl--font-weight);
  line-height: var(--text-display-2xl--line-height);
  letter-spacing: var(--text-display-2xl--letter-spacing);
}
</style>
