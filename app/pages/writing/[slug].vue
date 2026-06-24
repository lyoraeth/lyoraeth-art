<script setup lang="ts">
import { PortableText } from '@portabletext/vue'

const { locale, t } = useI18n()
const route = useRoute()
const slug  = route.params.slug as string

const { data: post } = await useFetch(`/api/post/${slug}`)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const title = computed(() =>
  post.value ? (locale.value === 'ru' && post.value.title.ru ? post.value.title.ru : post.value.title.en) : ''
)

useSeoMeta({ title: computed(() => `${title.value} — lyoraeth`) })

const formatDate = useFormatDate()

/* ── Portable Text custom components ── */
const ptComponents = {
  types: {
    image: defineComponent({
      props: ['value'],
      setup(props) {
        return () => h('figure', { class: 'pt-figure' }, [
          h('picture', { style: 'display: contents' }, [
            h('source', { srcset: sanityFmt(props.value.url, 'avif', { w: 800, q: 80 }), type: 'image/avif' }),
            h('source', { srcset: sanityFmt(props.value.url, 'webp', { w: 800, q: 80 }), type: 'image/webp' }),
            h('img', {
              src:     props.value.url,
              alt:     props.value.alt ?? '',
              loading: 'lazy',
              class:   'pt-img',
            }),
          ]),
          props.value.caption
            ? h('figcaption', { class: 'pt-caption' }, props.value.caption)
            : null,
        ])
      },
    }),
  },
  marks: {
    link: defineComponent({
      props: ['value'],
      setup(props, { slots }) {
        return () => h('a', {
          href:   props.value.href,
          target: '_blank',
          rel:    'noopener noreferrer',
          class:  'pt-link',
        }, slots.default?.())
      },
    }),
    code: defineComponent({
      setup(_, { slots }) { return () => h('code', { class: 'pt-inline-code' }, slots.default?.()) },
    }),
  },
}
</script>

<template>
  <article class="post-page" v-if="post">
    <!-- Back -->
    <NuxtLink to="/writing" class="back-link">
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
      />
    </div>

    <!-- Body -->
    <div class="post-body prose">
      <PortableText :value="post.body ?? []" :components="ptComponents" />
    </div>

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
}

/* ── Prose (body) ── */
.post-body {
  color: var(--ink);
  line-height: 1.75;
  font-size: 1.0625rem;
  margin-bottom: 3rem;
}

/* Headings */
:deep(.post-body h1),
:deep(.post-body h2),
:deep(.post-body h3) {
  font-weight: 600;
  letter-spacing: -0.025em;
  margin: 2.5rem 0 0.75rem;
  color: var(--snow);
}
:deep(.post-body h1) { font-size: 1.75rem; line-height: 1.15; }
:deep(.post-body h2) { font-size: 1.375rem; line-height: 1.2; }
:deep(.post-body h3) { font-size: 1.125rem; line-height: 1.25; }

/* Paragraphs */
:deep(.post-body p) { margin: 0 0 1.25rem; }
:deep(.post-body p:last-child) { margin-bottom: 0; }

/* Strong / em */
:deep(.post-body strong) { color: var(--snow); font-weight: 600; }
:deep(.post-body em) { color: var(--mist); }

/* Blockquote */
:deep(.post-body blockquote) {
  border-left: 2px solid var(--ember);
  margin: 1.75rem 0;
  padding: 0.125rem 0 0.125rem 1.25rem;
  color: var(--mist);
  font-style: italic;
}

/* Code inline */
:deep(.pt-inline-code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  background: oklch(100% 0 0 / 6%);
  border: 1px solid var(--line-soft);
  border-radius: 0.25rem;
  padding: 0.1em 0.4em;
  color: var(--ember);
}

/* Links */
:deep(.pt-link) {
  color: var(--ember);
  text-decoration: underline;
  text-decoration-color: oklch(72% 0.1 58 / 40%);
  text-underline-offset: 2px;
  transition: text-decoration-color 0.2s;
}
:deep(.pt-link:hover) { text-decoration-color: var(--ember); }

/* Images */
:deep(.pt-figure) {
  margin: 2rem 0;
}
:deep(.pt-img) {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  border: 1px solid var(--line-soft);
  display: block;
}
:deep(.pt-caption) {
  font-size: 0.8125rem;
  color: var(--faint);
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
}

/* Lists */
:deep(.post-body ul),
:deep(.post-body ol) {
  margin: 0 0 1.25rem 1.5rem;
}
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
</style>
