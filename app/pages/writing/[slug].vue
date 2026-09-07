<script setup lang="ts">
import type { PostDetail } from '../../../server/api/post/[slug].get'

definePageMeta({ layout: 'redesign' })

const { locale, t } = useI18n()
const localePath    = useLocalePath()
const loc   = useLoc()
const route = useRoute()
const slug  = route.params.slug as string

const { data: post } = await useFetch<PostDetail | null>(`/api/post/${slug}`)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const title = computed(() =>
  post.value ? (locale.value === 'ru' && post.value.title.ru ? post.value.title.ru : post.value.title.en) : ''
)

const excerpt = computed(() =>
  post.value ? (locale.value === 'ru' && post.value.excerpt.ru ? post.value.excerpt.ru : post.value.excerpt.en) : ''
)

const { ogImage, pageUrl } = useArticleSeo({
  type:        'writing',
  title:       () => title.value,
  description: () => excerpt.value,
  coverUrl:    () => post.value?.coverUrl,
  coverWidth:  () => post.value?.coverWidth,
  coverHeight: () => post.value?.coverHeight,
  coverAlt:    () => post.value?.coverAlt,
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title.value,
      description: excerpt.value,
      datePublished: post.value?.publishedAt,
      dateModified: post.value?._updatedAt,
      inLanguage: locale.value === 'ru' ? 'ru-RU' : 'en-US',
      ...(post.value?.tags?.length && { keywords: post.value.tags.join(', ') }),
      ...(post.value?.readingTime && { timeRequired: `PT${post.value.readingTime}M` }),
      wordCount: post.value?.wordCount,
      ...(post.value?.coverUrl && { image: ogImage.value }),
      url: pageUrl.value,
      mainEntityOfPage: pageUrl.value,
      author: {
        '@type': 'Person',
        name: 'Danil Klimov',
        url: 'https://lyoraeth.art',
      },
      publisher: {
        '@type': 'Person',
        name: 'Danil Klimov',
        url: 'https://lyoraeth.art',
      },
    })),
  }, {
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'),      item: `https://lyoraeth.art${localePath('/')}` },
        { '@type': 'ListItem', position: 2, name: t('nav.writing'),   item: `https://lyoraeth.art${localePath('/writing')}` },
        { '@type': 'ListItem', position: 3, name: title.value,        item: pageUrl.value },
      ],
    })),
  }],
})

const formatDate = useFormatDate()

const { renderPost } = useMarkdown()
const bodyHtml = computed(() => {
  if (!post.value) return ''
  const raw = locale.value === 'ru' ? post.value.body.ru : post.value.body.en
  if (!raw || typeof raw !== 'string') return ''
  return renderPost(raw)
})

/* ── Mermaid ──
   ```mermaid``` fences render server-side as inert text inside a plain
   `.mermaid` div (see useMarkdown); this turns them into diagrams once the
   div is actually in the DOM. Loaded on demand — most posts have no
   diagrams, and the library is too heavy to sit in every page's bundle. */
async function renderMermaid() {
  await nextTick()
  if (!document.querySelector('.post-body .mermaid')) return

  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    fontFamily: 'PP Neue Montreal, ui-sans-serif, system-ui, sans-serif',
    themeVariables: {
      primaryColor: '#EEF0F1',
      primaryTextColor: '#1F2123',
      primaryBorderColor: '#D3D6D9',
      lineColor: '#8895A5',
      secondaryColor: '#F3F5F6',
      tertiaryColor: '#FFFFFF',
      textColor: '#1F2123',
    },
  })
  await mermaid.run({ querySelector: '.post-body .mermaid' })
}

onMounted(renderMermaid)
watch(bodyHtml, renderMermaid)

/* ── TOC ──
   One data source, two renderings: a sticky sidebar at xl (its own grid
   column) and a plain, always-visible list inline in the article below it
   — not the same markup repositioned, only the sidebar needs to track
   scroll position visually. */
const { toc, activeId, jumpTo } = useToc({
  markdown:   () => (locale.value === 'ru' ? post.value?.body.ru : post.value?.body.en) ?? '',
  introLabel: () => t('writing.toc_intro'),
  content:    () => bodyHtml.value,
})

const tocMeta = computed(() => {
  const entries: { id: string; label: string }[] = []
  if (post.value?.references?.length) entries.push({ id: 'post-references', label: t('writing.toc_references') })
  entries.push({ id: 'post-comments', label: t('writing.toc_comments') })
  return entries
})

const track = useTrack()

useReadingProgressBar({
  onComplete: () => track(EV.postCompleted, { slug }),
})

onMounted(() => {
  track(EV.postRead, { slug })
})
</script>

<template>
  <div v-if="post" class="flex flex-col gap-y-section-gap py-section-padding-y">
    <!-- Back + prev/next -->
    <div class="flex items-center justify-between flex-wrap gap-x-6 gap-y-2">
      <NuxtLink :to="localePath('/writing')" class="post-nav-link">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ t('writing.back') }}
      </NuxtLink>

      <div v-if="post.prev || post.next" class="flex items-center gap-5">
        <NuxtLink
          v-if="post.prev"
          :to="localePath(`/writing/${post.prev.slug}`)"
          class="post-nav-link"
          :aria-label="`${t('writing.prev_post')}: ${loc(post.prev.title)}`"
          :title="loc(post.prev.title)"
        >
          <span aria-hidden="true">←</span>
          <span>{{ t('writing.prev_post') }}</span>
        </NuxtLink>
        <NuxtLink
          v-if="post.next"
          :to="localePath(`/writing/${post.next.slug}`)"
          class="post-nav-link"
          :aria-label="`${t('writing.next_post')}: ${loc(post.next.title)}`"
          :title="loc(post.next.title)"
        >
          <span>{{ t('writing.next_post') }}</span>
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Article — centred rather than flush left: two empty columns, a gap,
         six of text, another gap, the TOC in the last two. -->
    <div class="layout-grid gap-grid-gap">
      <article class="col-span-4 md:col-span-8 xl:col-start-4 xl:col-span-6 min-w-0">
        <header class="post-column flex flex-col gap-6 mb-10">
          <div class="flex items-center gap-2.5 type-ui text-text-secondary">
            <span>{{ formatDate(post.publishedAt, 'long') }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ t('writing.min_read', { n: post.readingTime }) }}</span>
          </div>
          <h1 class="type-display-2xl text-text-primary">{{ title }}</h1>
          <div v-if="post.tags.length" class="flex flex-wrap gap-2">
            <span v-for="tag in post.tags" :key="tag" class="tag-pill">{{ tag }}</span>
          </div>
        </header>

        <div v-if="post.coverUrl" class="post-cover">
          <SanityPicture
            :src="post.coverUrl"
            :alt="post.coverAlt ?? title"
            loading="eager"
            fetchpriority="high"
            :width="900"
            :height="post.coverWidth && post.coverHeight ? Math.round(900 * post.coverHeight / post.coverWidth) : undefined"
          />
        </div>

        <!-- Below xl — always visible, no border or toggle, otherwise the
             same list as the sidebar; that one takes over from xl. -->
        <nav v-if="toc.length >= 2" class="post-column toc-plain xl:hidden mb-10" aria-label="Table of contents">
          <span class="toc-label type-ui text-text-secondary">{{ t('writing.toc') }}</span>
          <ol class="toc-list">
            <li
              v-for="entry in toc"
              :key="entry.id"
              :class="['toc-item', entry.level !== 'intro' && `toc-item--h${entry.level}`]"
            >
              <a
                :href="`#${entry.id}`"
                class="toc-link"
                :class="{ active: activeId === entry.id }"
              >{{ entry.text }}</a>
            </li>
            <li class="toc-divider" aria-hidden="true" />
            <li v-for="entry in tocMeta" :key="entry.id" class="toc-item">
              <a
                href="#"
                class="toc-link"
                :class="{ active: activeId === entry.id }"
                @click.prevent="jumpTo(entry.id)"
              >{{ entry.label }}</a>
            </li>
          </ol>
        </nav>

        <div class="post-body post-column" v-html="bodyHtml" />

        <footer v-if="post.references?.length" id="post-references" class="post-column post-references">
          <span class="post-references__label type-ui text-text-secondary">{{ t('writing.toc_references') }}</span>
          <ol class="post-references__list">
            <li v-for="ref in post.references" :key="ref.href">
              <a :href="ref.href" target="_blank" rel="noopener noreferrer" @click="track(EV.referenceClick, { slug, href: ref.href })">{{ ref.title }}</a>
            </li>
          </ol>
        </footer>

        <div class="post-divider" />

        <section class="post-column">
          <PostRating :slug="slug" />
        </section>

        <div class="post-divider" />

        <section id="post-comments" class="post-column">
          <PostComments :slug="slug" :post-title="post.title.en" />
        </section>
      </article>

      <!-- TOC sidebar — last two of twelve columns at xl only; sticky
           inside the article's own row, so it naturally stops scrolling
           with the page once the row (and the comments inside it) ends,
           rather than needing a scroll-handler clamp against the viewport. -->
      <aside v-if="toc.length >= 2" class="hidden xl:block xl:col-start-11 xl:col-span-2">
        <nav class="toc-sidebar">
          <span class="toc-label type-ui text-text-secondary">{{ t('writing.toc') }}</span>
          <ol class="toc-list">
            <li
              v-for="entry in toc"
              :key="entry.id"
              :class="['toc-item', entry.level !== 'intro' && `toc-item--h${entry.level}`]"
            >
              <a
                :href="`#${entry.id}`"
                class="toc-link"
                :class="{ active: activeId === entry.id }"
              >{{ entry.text }}</a>
            </li>
            <li class="toc-divider" aria-hidden="true" />
            <li v-for="entry in tocMeta" :key="entry.id" class="toc-item">
              <a
                href="#"
                class="toc-link"
                :class="{ active: activeId === entry.id }"
                @click.prevent="jumpTo(entry.id)"
              >{{ entry.label }}</a>
            </li>
          </ol>
        </nav>
      </aside>
    </div>
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

  .post-cover {
    margin-bottom: calc(var(--spacing) * 10);
    border-radius: var(--radius-3xl);
    overflow: hidden;
    outline: 1px solid var(--color-border-default);
  }

  .post-cover :deep(img) {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ── TOC — shared between the sidebar and the mobile disclosure ── */
  .toc-label {
    display: block;
    margin-bottom: calc(var(--spacing) * 2);
  }

  .toc-list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 0.5);
    list-style: none;
  }

  .toc-item--h3 {
    padding-left: calc(var(--spacing) * 3);
  }

  .toc-divider {
    height: 1px;
    margin: calc(var(--spacing) * 2) 0;
    background-color: var(--color-border-default);
  }

  .toc-link {
    display: block;
    padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 2);
    border-radius: var(--radius-2xl);
    font-size: var(--text-ui);
    color: var(--color-text-secondary);
    transition: color var(--duration-hover) var(--ease-base),
                background-color var(--duration-hover) var(--ease-base);
  }

  .toc-link:hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-hover);
  }

  /* Ambient — it moves on its own as the page scrolls, not something the
     reader picked, so it stays on the same weight as hover rather than the
     fill-strong the site otherwise uses for a deliberate selection. */
  .toc-link.active {
    color: var(--color-accent-strong);
    background-color: var(--color-surface-hover);
  }

  .toc-sidebar {
    position: sticky;
    top: calc(var(--spacing-header-height) + var(--spacing) * 6);
  }

  /*
   * Below xl the list sits in the flow, read once at the top of the article
   * and then either skipped or clicked — there's nothing to track scroll
   * position against here, so the pill chrome and the active state that
   * exist to support that (sidebar only) both come off; these just read as
   * plain links.
   */
  .toc-plain .toc-list {
    gap: calc(var(--spacing) * 2);
  }

  .toc-plain .toc-link {
    padding: 0;
    border-radius: 0;
    color: var(--color-accent-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .toc-plain .toc-link:hover,
  .toc-plain .toc-link.active {
    color: var(--color-accent-strong-hover);
    background-color: transparent;
  }

  /* ── References ── */
  .post-references {
    margin-top: calc(var(--spacing) * 10);
    margin-bottom: calc(var(--spacing) * 10);
  }

  .post-references__label {
    display: block;
    margin-bottom: calc(var(--spacing) * 3);
  }

  .post-references__list {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 1.5);
    counter-reset: ref;
    list-style: none;
  }

  .post-references__list li {
    counter-increment: ref;
    display: flex;
    gap: calc(var(--spacing) * 2.5);
    font-size: var(--text-text);
    line-height: 1.4;
  }

  .post-references__list li::before {
    content: counter(ref) '.';
    flex-shrink: 0;
    min-width: 1.25rem;
    color: var(--color-text-decorative);
    font-size: var(--text-ui);
  }

  .post-references__list a {
    color: var(--color-accent-strong);
    transition: color var(--duration-hover) var(--ease-base);
  }

  .post-references__list a:hover {
    color: var(--color-accent-strong-hover);
  }

  .post-divider {
    height: 1px;
    margin-block: calc(var(--spacing) * 10);
    background-color: var(--color-border-default);
  }
}

/*
 * ── Prose (body) ──
 * Width and centring come from .post-column (design-system.css), applied
 * throughout this article to everything that isn't meant to run the full
 * width — header, TOC below xl, this body, references, rating, comments.
 */
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

:deep(.post-body h2),
:deep(.post-body h3) {
  color: var(--color-text-primary);
  font-family: var(--font-display);
  font-weight: 600;
  margin: 2.5rem 0 0.75rem;
}
:deep(.post-body h2) {
  font-size: var(--text-display-xl);
  line-height: var(--text-display-xl--line-height);
  letter-spacing: var(--text-display-xl--letter-spacing);
}
:deep(.post-body h3) {
  font-size: var(--text-display-lg);
  line-height: var(--text-display-lg--line-height);
  letter-spacing: var(--text-display-lg--letter-spacing);
}

:deep(.post-body hr) {
  border: none;
  border-top: 1px solid var(--color-border-default);
  margin: 2rem 0;
}

:deep(.post-body strong) { color: var(--color-text-primary); font-weight: 600; }
:deep(.post-body em) { font-style: italic; }

:deep(.post-body blockquote) {
  border-left: 2px solid var(--color-accent-strong);
  margin: 1.75rem 0;
  padding: 0.125rem 0 0.125rem 1.25rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

:deep(.post-body code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875em;
  background-color: var(--color-surface-hover);
  border-radius: 0.25rem;
  padding: 0.1em 0.4em;
  color: var(--color-accent-strong);
}

:deep(.post-body pre) {
  background-color: var(--color-surface-panel);
  border-radius: var(--radius-2xl);
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
:deep(.post-body pre code) {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

/* Renders as inert text until mermaid.run() replaces it with an <svg> —
   see renderMermaid() in the page script. */
:deep(.post-body .mermaid) {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
  overflow-x: auto;
}

:deep(.post-body a) {
  color: var(--color-accent-strong);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--duration-hover) var(--ease-base);
}
:deep(.post-body a:hover) { color: var(--color-accent-strong-hover); }

:deep(.post-body .post-figure) { margin: 2rem 0; }
:deep(.post-body .post-img) {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-2xl);
  outline: 1px solid var(--color-border-default);
}
:deep(.post-body .post-caption) {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
}

/* list-style: revert — Preflight zeroes it globally, which left every
   marker invisible even though the items themselves rendered fine. */
:deep(.post-body ul),
:deep(.post-body ol) {
  list-style: revert;
  margin: 0 0 1.25rem 1.5rem;
}
:deep(.post-body li) { margin-bottom: 0.375rem; }

:deep(.post-body table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: var(--text-ui);
}
:deep(.post-body th),
:deep(.post-body td) {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border-default);
  text-align: left;
  vertical-align: top;
}
:deep(.post-body th) {
  color: var(--color-text-primary);
  font-weight: 600;
}
:deep(.post-body td) { color: var(--color-text-secondary); }
</style>
