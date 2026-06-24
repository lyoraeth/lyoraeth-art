<script setup lang="ts">
import type { PostItem } from '../../../server/api/posts.get'

const { t } = useI18n()
const plural = usePlural()
const loc    = useLoc()

useSeoMeta({ title: computed(() => `${t('writing.title')} — lyoraeth`) })

const { data: allPosts } = await useFetch('/api/posts', {
  query: { limit: 0 },
  default: () => [] as PostItem[],
})

/* ── Filters ── */
type SortKey = 'date-desc' | 'date-asc' | 'alpha' | 'popular'
const search = ref('')
const sortBy = ref<SortKey>('date-desc')

const formatDate = useFormatDate()

const filtered = computed<PostItem[]>(() => {
  let posts = [...(allPosts.value ?? [])]

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    posts = posts.filter(p =>
      p.title.en.toLowerCase().includes(q) ||
      (p.title.ru ?? '').toLowerCase().includes(q) ||
      p.tags.some(tag => tag.toLowerCase().includes(q)),
    )
  }

  switch (sortBy.value) {
    case 'date-asc':
      return posts.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
    case 'alpha':
      return posts.sort((a, b) => loc(a.title).localeCompare(loc(b.title)))
    case 'popular':
      return posts.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    default:
      return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }
})

const sorts = computed(() => [
  { key: 'date-desc' as SortKey, label: t('writing.sort_date_desc') },
  { key: 'date-asc'  as SortKey, label: t('writing.sort_date_asc')  },
  { key: 'alpha'     as SortKey, label: t('writing.sort_alpha')      },
  { key: 'popular'   as SortKey, label: t('writing.sort_popular')    },
])
</script>

<template>
  <div class="writing-page">
    <header class="page-head">
      <h1>{{ t('writing.title') }}</h1>
      <span class="eyebrow">{{ t(`writing.posts_${plural(filtered.length)}`, { n: filtered.length }) }}</span>
    </header>

    <div class="writing-layout">
      <!-- Sidebar -->
      <aside class="sidebar glass-card">
        <div class="sb-section">
          <label class="sb-label" for="search">{{ t('writing.search') }}</label>
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.25"/>
              <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
            </svg>
            <input
              id="search"
              v-model="search"
              class="search-input"
              type="search"
              :placeholder="t('writing.search_placeholder')"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="sb-section">
          <span class="sb-label">{{ t('writing.sort_by') }}</span>
          <div class="sort-list">
            <button
              v-for="s in sorts"
              :key="s.key"
              class="sort-btn"
              :class="{ active: sortBy === s.key }"
              @click="sortBy = s.key"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Post list -->
      <main class="post-list">
        <TransitionGroup name="post" tag="div" class="post-list-inner">
          <a
            v-for="post in filtered"
            :key="post._id"
            :href="`/writing/${post.slug}`"
            class="post-row glass-card"
          >
            <div class="post-row-meta">
              <span class="mono row-date">{{ formatDate(post.publishedAt) }}</span>
              <span class="row-dot"></span>
              <span class="mono row-time">{{ t('writing.min', { n: post.readingTime }) }}</span>
            </div>
            <h2 class="row-title">{{ loc(post.title) }}</h2>
            <div class="row-footer">
              <div class="row-tags">
                <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
              <span class="row-read">{{ t('writing.read') }} <span class="row-arrow">→</span></span>
            </div>
          </a>
        </TransitionGroup>

        <p v-if="filtered.length === 0" class="empty">{{ t('writing.not_found') }}</p>
      </main>
    </div>
  </div>
</template>

<style scoped>
.writing-page {
  max-width: var(--content-width, 72rem);
  margin: 0 auto;
  padding: clamp(5rem, 10vw, 9rem) var(--page-px, 1.5rem) clamp(4rem, 8vw, 8rem);
}

/* ── Header ── */
.page-head {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}
.page-head h1 {
  font-size: clamp(2rem, 2rem + 2vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}
.page-head .eyebrow {
  color: var(--faint);
}

/* ── Layout ── */
.writing-layout {
  display: grid;
  grid-template-columns: 14rem 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* ── Sidebar ── */
.sidebar {
  position: sticky;
  top: 5.5rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-radius: var(--radius-card-sm);
}
.sb-section { display: flex; flex-direction: column; gap: 0.625rem; }
.sb-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
}

/* Search */
.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.875rem;
  height: 0.875rem;
  color: var(--faint);
  pointer-events: none;
}
.search-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  background: oklch(100% 0 0 / 3%);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  padding: 0.4375rem 0.625rem 0.4375rem 2rem;
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--snow);
  outline: none;
  transition: border-color 0.2s;
}
.search-input::placeholder { color: var(--faint); }
.search-input:focus { border-color: rgba(214, 154, 106, 0.4); border-color: oklch(72% 0.1 58 / 40%); }
.search-input::-webkit-search-cancel-button { display: none; }

/* Sort */
.sort-list { display: flex; flex-direction: column; gap: 0.125rem; }
.sort-btn {
  text-align: left;
  padding: 0.4375rem 0.625rem;
  border-radius: var(--radius-tag);
  font-size: 0.875rem;
  color: var(--mist);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.sort-btn:hover  { color: var(--snow); background: rgba(255, 255, 255, 0.04); background: oklch(100% 0 0 / 4%); }
.sort-btn.active { color: var(--ember); background: var(--ember-bg); }

/* ── Post list ── */
.post-list { min-width: 0; }
.post-list-inner { display: flex; flex-direction: column; gap: 0.625rem; }

.post-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-card-sm);
  text-decoration: none;
  color: inherit;
  transition:
    opacity      var(--duration-reveal) var(--ease-out-expo),
    transform    var(--duration-reveal) var(--ease-out-expo),
    border-color 0.3s var(--ease-silk);
}
.post-row:hover { border-color: rgba(214, 154, 106, 0.3); border-color: oklch(72% 0.1 58 / 30%); }

.post-row-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--faint);
}
.row-date, .row-time { font-size: 0.65625rem; }
.row-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--faint);
  flex-shrink: 0;
}
.row-title {
  font-size: clamp(1rem, 0.875rem + 0.5vw, 1.25rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.row-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.25rem;
}
.row-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
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
.row-read {
  flex-shrink: 0;
  color: var(--ember);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.row-arrow {
  display: inline-block;
  transition: transform 0.3s var(--ease-out-expo);
}
.post-row:hover .row-arrow { transform: translateX(0.25rem); }

/* Transition */
.post-enter-active, .post-leave-active { transition: opacity 0.2s, transform 0.2s; }
.post-enter-from, .post-leave-to { opacity: 0; transform: translateY(0.5rem); }

.empty { color: var(--faint); font-size: 0.875rem; padding: 2rem 0; }

/* ── Responsive ── */
@media (max-width: 52rem) {
  .writing-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}
</style>
