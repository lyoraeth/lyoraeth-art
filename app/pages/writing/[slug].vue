<script setup lang="ts">
import { Marked } from 'marked'

const { locale, t } = useI18n()
const localePath    = useLocalePath()
const route = useRoute()
const slug  = route.params.slug as string

const { data: post } = await useFetch<import('~/server/api/post/[slug].get').PostDetail | null>(`/api/post/${slug}`)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const title = computed(() =>
  post.value ? (locale.value === 'ru' && post.value.title.ru ? post.value.title.ru : post.value.title.en) : ''
)

const ogImage = computed(() => post.value?.coverUrl ?? 'https://lyoraeth.art/og-image.png')

useSeoMeta({
  title:            computed(() => `${title.value} — lyoraeth`),
  ogTitle:          computed(() => title.value),
  ogDescription:    computed(() => post.value?.title.en ?? ''),
  ogImage:          ogImage,
  ogType:           'article',
  twitterCard:      'summary_large_image',
  twitterImage:     ogImage,
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title.value,
      datePublished: post.value?.publishedAt,
      ...(ogImage.value !== 'https://lyoraeth.art/og-image.png' && { image: ogImage.value }),
      url: `https://lyoraeth.art/writing/${slug}`,
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
  }],
})

const formatDate = useFormatDate()

const { progress, active } = useReadingProgress()

onMounted(() => {
  active.value = true
  const update = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight
    progress.value = total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0
  }
  window.addEventListener('scroll', update, { passive: true })
  update()
  onUnmounted(() => {
    window.removeEventListener('scroll', update)
    active.value = false
    progress.value = 0
  })
})

const md = new Marked({
  renderer: {
    image({ href, title, text }) {
      const caption = title ? `<figcaption class="post-caption">${title}</figcaption>` : ''
      return `<figure class="post-figure"><img src="${href}" alt="${text ?? ''}" loading="lazy" class="post-img">${caption}</figure>`
    },
  },
})

const bodyHtml = computed(() => {
  if (!post.value) return ''
  const raw = locale.value === 'ru' ? post.value.body.ru : post.value.body.en
  if (!raw || typeof raw !== 'string') return ''
  const html = md.parse(raw) as string
  return html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"')
})
</script>

<template>
  <article class="post-page" v-if="post">
    <!-- Back -->
    <NuxtLink :to="localePath('/writing')" class="back-link">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ t('writing.back') }}
    </NuxtLink>

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
        :width="900"
        :height="post.coverWidth && post.coverHeight ? Math.round(900 * post.coverHeight / post.coverWidth) : undefined"
      />
    </div>

    <!-- Body -->
    <div class="post-body" v-html="bodyHtml" />

    <!-- References -->
    <footer v-if="post.references?.length" class="post-references">
      <span class="references-label">источники</span>
      <ol class="references-list">
        <li v-for="ref in post.references" :key="ref.href">
          <a :href="ref.href" target="_blank" rel="noopener noreferrer">{{ ref.title }}</a>
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

    <section class="post-comments">
      <PostComments :slug="slug" :post-title="post.title.en" />
    </section>
  </article>
</template>

<style scoped>
.post-page {
  max-width: 44rem;
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 8rem) var(--page-px, 1.5rem) clamp(4rem, 8vw, 8rem);
}

/* ── Back ── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--faint);
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 2.5rem;
  transition: color 0.2s;
}
.back-link:hover { color: var(--snow); }
.back-link svg { width: 1rem; height: 1rem; }

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
