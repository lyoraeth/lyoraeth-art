<script setup lang="ts">
import type { PostDetail } from '../../../server/api/post/[slug].get'

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

/* ── TOC ── */
const { toc, activeId, tocOpen, tocBtnEl, tocAsideEl, tocPanelStyle, jumpTo } = useToc({
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
  <div class="post-outer" v-if="post">

  <!-- Mobile TOC button (teleported into nav right slot) -->
  <Teleport v-if="toc.length >= 2" to="#nav-toc-slot">
    <button
      ref="tocBtnEl"
      class="toc-btn"
      :class="{ 'toc-btn--open': tocOpen }"
      :aria-label="t('writing.toc')"
      :aria-expanded="tocOpen"
      @click="tocOpen = !tocOpen"
    >
      <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
        <line x1="0" y1="1"  x2="13" y2="1"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="2" y1="5"  x2="11" y2="5"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="0" y1="9"  x2="13" y2="9"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="2" y1="13" x2="9"  y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </Teleport>

  <!-- Mobile TOC panel + backdrop -->
  <Teleport v-if="toc.length >= 2" to="body">
    <Transition name="toc-panel">
      <div v-if="tocOpen" class="toc-mob-panel" role="dialog" :aria-label="t('writing.toc')" :style="tocPanelStyle">
        <span class="toc-label">{{ t('writing.toc') }}</span>
        <ol class="toc-list">
          <li
            v-for="entry in toc"
            :key="entry.id"
            :class="['toc-item', entry.level !== 'intro' && `toc-item--h${entry.level}`]"
          >
            <a
              :href="`#${entry.id}`"
              class="toc-link"
              :class="{ 'toc-link--active': activeId === entry.id }"
              @click="tocOpen = false"
            >{{ entry.text }}</a>
          </li>
          <li class="toc-divider-item" aria-hidden="true" />
          <li
            v-for="entry in tocMeta"
            :key="entry.id"
            class="toc-item toc-item--meta"
          >
            <a
              :href="`#${entry.id}`"
              class="toc-link"
              :class="{ 'toc-link--active': activeId === entry.id }"
              @click.prevent="jumpTo(entry.id, true)"
            >{{ entry.label }}</a>
          </li>
        </ol>
      </div>
    </Transition>
    <Transition name="toc-bd">
      <div v-if="tocOpen" class="toc-backdrop" @click="tocOpen = false" />
    </Transition>
  </Teleport>

  <!-- TOC sidebar (desktop, ≥2 headings). position: fixed — NOT sticky: the
       global overflow-x: hidden on html/body turns body into a scroll
       container and kills sticky (hard-won lesson). The stop-at-article-end
       behavior comes from a small clamp in the scroll handler instead. -->
  <aside v-if="toc.length >= 2" ref="tocAsideEl" class="toc-sidebar" aria-label="Table of contents">
    <nav class="toc-nav">
      <span class="toc-label">{{ t('writing.toc') }}</span>
      <ol class="toc-list">
        <li
          v-for="entry in toc"
          :key="entry.id"
          :class="['toc-item', entry.level !== 'intro' && `toc-item--h${entry.level}`]"
        >
          <a
            :href="`#${entry.id}`"
            class="toc-link"
            :class="{ 'toc-link--active': activeId === entry.id }"
          >{{ entry.text }}</a>
        </li>
        <li class="toc-divider-item" aria-hidden="true" />
        <li
          v-for="entry in tocMeta"
          :key="entry.id"
          class="toc-item toc-item--meta"
        >
          <a
            :href="`#${entry.id}`"
            class="toc-link"
            :class="{ 'toc-link--active': activeId === entry.id }"
            @click.prevent="jumpTo(entry.id)"
          >{{ entry.label }}</a>
        </li>
      </ol>
    </nav>
  </aside>

  <article class="post-page">
    <!-- Back + prev/next -->
    <div class="post-topnav">
      <NuxtLink :to="localePath('/writing')" class="back-link">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ t('writing.back') }}
      </NuxtLink>

      <div v-if="post.prev || post.next" class="adjacent-nav">
        <NuxtLink
          v-if="post.prev"
          :to="localePath(`/writing/${post.prev.slug}`)"
          class="back-link adjacent-link"
          :aria-label="`${t('writing.prev_post')}: ${loc(post.prev.title)}`"
          :title="loc(post.prev.title)"
        >
          <span aria-hidden="true">←</span>
          <span>{{ t('writing.prev_post') }}</span>
        </NuxtLink>
        <NuxtLink
          v-if="post.next"
          :to="localePath(`/writing/${post.next.slug}`)"
          class="back-link adjacent-link"
          :aria-label="`${t('writing.next_post')}: ${loc(post.next.title)}`"
          :title="loc(post.next.title)"
        >
          <span>{{ t('writing.next_post') }}</span>
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Header -->
    <header class="post-header">
      <div class="post-meta">
        <span class="mono meta-date">{{ formatDate(post.publishedAt, 'long') }}</span>
        <span class="meta-dot"></span>
        <span class="mono">{{ t('writing.min_read', { n: post.readingTime }) }}</span>
      </div>
      <h1 class="post-title">{{ title }}</h1>
      <div class="post-tags">
        <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </header>

    <!-- Cover -->
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

    <!-- Body -->
    <div class="post-body" v-html="bodyHtml" />

    <!-- References -->
    <footer v-if="post.references?.length" id="post-references" class="post-references">
      <span class="references-label">{{ t('writing.toc_references') }}</span>
      <ol class="references-list">
        <li v-for="ref in post.references" :key="ref.href">
          <a :href="ref.href" target="_blank" rel="noopener noreferrer" @click="track(EV.referenceClick, { slug, href: ref.href })">{{ ref.title }}</a>
        </li>
      </ol>
    </footer>

    <!-- Divider -->
    <hr class="post-divider" />

    <!-- Rating -->
    <section class="post-aside">
      <PostRating :slug="slug" />
    </section>

    <!-- Comments -->
    <hr class="post-divider" />

    <section id="post-comments" class="post-comments">
      <PostComments :slug="slug" :post-title="post.title.en" />
    </section>
  </article>
  </div>
</template>

<style scoped>
/* ── Mobile TOC button ── */
.toc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: none;
  color: var(--faint);
  cursor: pointer;
  border-radius: 0.5rem;
  transition: color 0.2s, background 0.2s;
}
.toc-btn:hover,
.toc-btn--open { color: var(--ink); background: oklch(100% 0 0 / 5%); }

/* ── TOC dropdown (mobile + tablet) ── */
.toc-mob-panel {
  position: fixed;
  z-index: 49;
  min-width: 13rem;
  max-width: min(18rem, calc(100vw - 2rem));
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.625rem;
  border-radius: var(--radius-card-sm, 1rem);
  background: oklch(10% 0.008 235 / 85%);
  backdrop-filter: blur(24px) saturate(1.6) brightness(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(1.6) brightness(1.05);
  border: 1px solid oklch(100% 0 0 / 10%);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 12%),
    0 1rem 2rem -0.5rem oklch(0% 0 0 / 60%);
}

.toc-backdrop {
  position: fixed;
  inset: 0;
  z-index: 48;
}

.toc-panel-enter-active,
.toc-panel-leave-active {
  transition: opacity 0.18s var(--ease-silk), transform 0.18s var(--ease-out-expo);
}
.toc-panel-enter-from,
.toc-panel-leave-to { opacity: 0; transform: translateY(-6px); }

.toc-bd-enter-active,
.toc-bd-leave-active { transition: opacity 0.18s; }
.toc-bd-enter-from,
.toc-bd-leave-to { opacity: 0; }

/* ── Desktop TOC sidebar ── */
.toc-sidebar { display: none; }

@media (min-width: 72rem) {
  .toc-sidebar {
    display: block;
    position: fixed;
    left: calc(75% + 5.5rem);
    top: 50%;
    transform: translateY(-50%);
    width: 11rem;
  }
}

.post-page {
  max-width: 44rem;
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 8rem) var(--page-px, 1.5rem) clamp(4rem, 8vw, 8rem);
}

/* ── TOC shared ── */
.toc-nav { display: flex; flex-direction: column; gap: 0.5rem; }

.toc-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
  display: block;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toc-item--h3 { padding-left: 0.75rem; }

.toc-divider-item {
  height: 1px;
  background: var(--line-soft);
  margin: 0.375rem 0.5rem;
  list-style: none;
}

/* meta items (sources, comments) — faint by default */
.toc-mob-panel .toc-item--meta .toc-link { color: var(--faint); }
.toc-mob-panel .toc-item--meta .toc-link:hover { color: var(--mist); }
.toc-mob-panel .toc-item--meta .toc-link--active { color: var(--ember); background: var(--ember-bg); }

.toc-sidebar .toc-item--meta .toc-link { color: var(--faint); opacity: 0.7; }
.toc-sidebar .toc-item--meta .toc-link:hover { opacity: 1; color: var(--mist); }
.toc-sidebar .toc-item--meta .toc-link--active { opacity: 1; color: var(--ember); border-left-color: var(--ember); background: var(--ember-bg); }

/* dropdown (mobile + tablet) — matches nav drop-item style */
.toc-mob-panel .toc-label {
  padding: 0.25rem 0.5rem 0.375rem;
}

.toc-mob-panel .toc-link {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--ink);
  text-decoration: none;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s, color 0.15s;
}
.toc-mob-panel .toc-link:hover { background: oklch(100% 0 0 / 4%); }
.toc-mob-panel .toc-link--active {
  color: var(--ember);
  background: var(--ember-bg);
}

/* sidebar (desktop ≥72rem) */
.toc-sidebar .toc-label { margin-bottom: 0.25rem; }

.toc-sidebar .toc-link {
  display: block;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--faint);
  text-decoration: none;
  padding: 0.25rem 0.375rem;
  border-radius: 0.375rem;
  border-left: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.toc-sidebar .toc-link:hover { color: var(--mist); background: oklch(100% 0 0 / 3%); }
.toc-sidebar .toc-link--active {
  color: var(--ember);
  border-left-color: var(--ember);
  background: var(--ember-bg);
}

/* ── Back + prev/next row ── */
.post-topnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-bottom: 2.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--faint);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--snow); }
.back-link svg { width: 1rem; height: 1rem; }

.adjacent-nav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

/* ── Header ── */
.post-header { margin-bottom: 2rem; }

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--faint);
  margin-bottom: 1rem;
}
.meta-date { font-size: 0.75rem; }
.meta-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--faint);
}

.post-title {
  font-size: clamp(1.75rem, 1.25rem + 2.5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.post-tags {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  color: var(--mist);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: rgba(255, 255, 255, 0.02);
  background: oklch(100% 0 0 / 2%);
}

/* ── Cover ── */
.post-cover {
  margin: 0 0 2.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--line-soft);
}
.post-cover img {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: auto 16/9;
}

/* ── Prose (body) ── */
.post-body {
  color: var(--ink);
  font-size: 1.0625rem;
  line-height: 1.9;
  margin-bottom: 3rem;
  hyphens: auto;
  font-kerning: normal;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* Lead paragraph */
:deep(.post-body > p:first-child) {
  font-size: 1.125rem;
  color: var(--snow);
  line-height: 1.8;
  margin-bottom: 1.75rem;
}
:deep(.post-body > p:first-child::first-letter) {
  font-size: 1.2em;
  font-weight: 700;
  color: var(--ember);
}

/* Paragraphs */
:deep(.post-body p)       { margin: 0 0 1.25rem; }
:deep(.post-body p:last-child) { margin-bottom: 0; }
:deep(.post-body p + p)   { text-indent: 1.5em; }

/* Headings */
:deep(.post-body h2),
:deep(.post-body h3) {
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--snow);
  margin: 2.5rem 0 0.75rem;
}
:deep(.post-body h2) { font-size: 1.375rem; line-height: 1.2; }
:deep(.post-body h3) { font-size: 1.125rem; line-height: 1.25; }

/* Divider from --- */
:deep(.post-body hr) {
  border: none;
  border-top: 1px solid var(--line-soft);
  margin: 2rem 0;
}

/* Strong / em */
:deep(.post-body strong) { color: var(--snow); font-weight: 600; }
:deep(.post-body em)     { color: var(--mist); }

/* Blockquote */
:deep(.post-body blockquote) {
  border-left: 2px solid var(--ember);
  margin: 1.75rem 0;
  padding: 0.125rem 0 0.125rem 1.25rem;
  color: var(--mist);
  font-style: italic;
}

/* Code inline */
:deep(.post-body code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  background: oklch(100% 0 0 / 6%);
  border: 1px solid var(--line-soft);
  border-radius: 0.25rem;
  padding: 0.1em 0.4em;
  color: var(--ember);
}

/* Code block */
:deep(.post-body pre) {
  background: oklch(100% 0 0 / 3%);
  border: 1px solid var(--line-soft);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
:deep(.post-body pre code) {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: var(--mist);
}

/* Links */
:deep(.post-body a) {
  color: var(--ember);
  text-decoration: underline;
  text-decoration-color: oklch(72% 0.1 58 / 40%);
  text-underline-offset: 2px;
  transition: text-decoration-color 0.2s;
}
:deep(.post-body a:hover) { text-decoration-color: var(--ember); }

/* Images */
:deep(.post-body .post-figure) { margin: 2rem 0; }
:deep(.post-body .post-img) {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  border: 1px solid var(--line-soft);
  display: block;
}
:deep(.post-body .post-caption) {
  font-size: 0.8125rem;
  color: var(--faint);
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
}

/* Lists */
:deep(.post-body ul),
:deep(.post-body ol) { margin: 0 0 1.25rem 1.5rem; }
:deep(.post-body li) { margin-bottom: 0.375rem; }

/* ── Dividers / sections ── */
.post-divider {
  border: none;
  border-top: 1px solid var(--line-soft);
  margin: 2.5rem 0;
}

.post-aside {
  display: flex;
  justify-content: center;
}

.post-comments { padding-bottom: 2rem; }

/* ── References ── */
.post-references {
  margin-bottom: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line-soft);
}

.references-label {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  color: var(--faint);
  margin-bottom: 0.75rem;
}

.references-list {
  list-style: none;
  margin: 0;
  padding: 0;
  counter-reset: ref;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.references-list li {
  counter-increment: ref;
  display: flex;
  gap: 0.625rem;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.references-list li::before {
  content: counter(ref) '.';
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  color: var(--faint);
  min-width: 1.25rem;
  padding-top: 0.05em;
  flex-shrink: 0;
}

.references-list a {
  color: var(--mist);
  text-decoration: none;
  transition: color 0.2s;
}

.references-list a:hover { color: var(--snow); }
</style>
