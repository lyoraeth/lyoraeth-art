<script setup lang="ts">
import type { PostItem } from '../../../server/api/posts.get'

definePageMeta({ layout: 'redesign' })

const { t, locale } = useI18n()
const plural = usePlural()
const loc    = useLoc()

useSeoMeta({
  title:         computed(() => `${t('writing.title')} — lyoraeth`),
  description:   computed(() => t('writing.seo_description')),
  ogTitle:       computed(() => `${t('writing.title')} — lyoraeth`),
  ogDescription: computed(() => t('writing.seo_description')),
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: computed(() => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: `${t('writing.title')} — lyoraeth`,
      url: `https://lyoraeth.art${locale.value === 'ru' ? '/ru' : ''}/writing`,
      inLanguage: locale.value,
    })),
  }],
})

const { data: allPosts } = await useFetch('/api/posts', {
  query: { limit: 0 },
  default: () => [] as PostItem[],
})

/* ── Filters ── */
type SortKey = 'date-desc' | 'date-asc' | 'alpha' | 'popular'
const search = ref('')
const sortBy = ref<SortKey>('date-desc')
const topicFilter = ref<string | null>(null)

// Small and fixed enough to browse in a dropdown rather than search for.
const topics = computed(() => {
  const seen = new Set<string>()
  for (const p of allPosts.value ?? []) {
    if (p.topic) seen.add(loc(p.topic))
  }
  return [...seen].sort((a, b) => a.localeCompare(b))
})

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

  if (topicFilter.value) {
    posts = posts.filter(p => p.topic && loc(p.topic) === topicFilter.value)
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

/* ── Scroll reveal ──
   First appearance is scroll-triggered, same observer as the dark shell
   used. Re-filtering doesn't wait on scroll, though — the grid is already
   on screen when a filter is touched, so that pass drops every current
   card's `in` and re-adds it a frame later, replaying the same fade for
   whatever the new filter left standing rather than reshuffling the old
   cards into new positions.

   The ref below has to stay a single stable function: an inline arrow in
   the v-for is a new closure every render, and Vue treats a changed ref
   identity as the element being unset and reset on every patch — including
   ones that didn't actually mount or unmount anything. That churn made only
   the cards that DID actually enter or leave end up observed correctly, and
   left every card that simply survived a filter change without a working
   ref. The id travels as a data attribute instead of a closure. */
const { observe } = useReveal()
const cardEls = new Map<string, HTMLElement>()

function setCardRef(instance: unknown) {
  const el = instance && typeof instance === 'object' && '$el' in instance
    ? (instance as { $el: unknown }).$el
    : instance

  if (el instanceof HTMLElement && el.dataset.postId) {
    cardEls.set(el.dataset.postId, el)
    observe(el)
  }
}

watch(filtered, (posts) => {
  const stillFiltered = new Set(posts.map(p => p._id))
  for (const id of cardEls.keys()) {
    if (!stillFiltered.has(id)) cardEls.delete(id)
  }

  // A card that's already visible has its transition running toward opacity
  // 1 — just removing `in` starts it reversing back toward 0, and re-adding
  // `in` a moment later reverses it again before it's gone anywhere. Net
  // motion: none, which is exactly the bug this caused. Turning the
  // transition off for the drop snaps it to hidden instantly instead of
  // reversing an animation in flight, so the reveal that follows always
  // starts from a real, settled 0 rather than wherever the reverse got to.
  cardEls.forEach(el => {
    el.style.transition = 'none'
    el.classList.remove('in')
    void el.offsetHeight
    el.style.transition = ''
  })

  nextTick(() => {
    // A card that survived the switch already went through the drop above
    // and just needs `in` back. A card mounting fresh this round (e.g.
    // switching between two topics with no overlap at all) never went
    // through it — its very first style is `.reveal-card`'s hidden state,
    // and a transition can't be observed starting from a style that was
    // never itself committed to a render. The reflow forces that commit for
    // both cases alike before `in` goes on.
    cardEls.forEach(el => { void el.offsetHeight })
    cardEls.forEach(el => el.classList.add('in'))
  })
})

const sorts = computed(() => [
  { key: 'date-desc' as SortKey, label: t('writing.sort_date_desc') },
  { key: 'date-asc'  as SortKey, label: t('writing.sort_date_asc')  },
  { key: 'alpha'     as SortKey, label: t('writing.sort_alpha')      },
  { key: 'popular'   as SortKey, label: t('writing.sort_popular')    },
])

/* ── Topic dropdown — a custom listbox rather than a native select, to
   carry the panel's own border and shadow instead of the browser's. ── */
const topicOpen = ref(false)
const topicRoot = ref<HTMLElement | null>(null)

function selectTopic(value: string | null) {
  topicFilter.value = value
  topicOpen.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!topicOpen.value) return
  if (!topicRoot.value?.contains(event.target as Node)) topicOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !topicOpen.value) return
  topicOpen.value = false
  topicRoot.value?.querySelector('button')?.focus()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="flex flex-col gap-y-section-gap py-section-padding-y">
    <header class="flex items-baseline gap-5">
      <h1 class="type-display-2xl text-text-primary">{{ t('writing.title') }}</h1>
      <span class="type-ui text-text-secondary">
        {{ t(`writing.count_${plural(filtered.length)}`, { n: filtered.length }) }}
      </span>
    </header>

    <div class="layout-grid gap-grid-gap">
      <!-- Filters — three of twelve columns on desktop, the fourth left empty
           for extra breathing room before the posts; full width and above the
           posts everywhere narrower (default source order already puts it
           first; the grid classes only change the width it claims). -->
      <aside class="col-span-4 md:col-span-8 xl:col-span-3 flex flex-col gap-8">
        <div class="flex flex-col gap-3">
          <label for="writing-search" class="type-ui text-text-secondary">{{ t('writing.search') }}</label>
          <div class="filter-search">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.25" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
            </svg>
            <input
              id="writing-search"
              v-model="search"
              type="search"
              :placeholder="t('writing.search_placeholder')"
              autocomplete="off"
            >
          </div>
        </div>

        <div v-if="topics.length" class="flex flex-col gap-3">
          <span id="writing-topic-label" class="type-ui text-text-secondary">{{ t('writing.topic') }}</span>
          <div ref="topicRoot" class="filter-dropdown">
            <button
              type="button"
              class="filter-dropdown__trigger"
              aria-haspopup="listbox"
              :aria-expanded="topicOpen"
              aria-labelledby="writing-topic-label"
              @click="topicOpen = !topicOpen"
            >
              <span>{{ topicFilter ?? t('writing.all_topics') }}</span>
              <svg class="filter-dropdown__chevron" :class="{ open: topicOpen }" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <ul v-if="topicOpen" class="filter-dropdown__panel" role="listbox">
              <li role="option" :aria-selected="topicFilter === null">
                <button
                  type="button"
                  class="filter-dropdown__option"
                  :class="{ active: topicFilter === null }"
                  @click="selectTopic(null)"
                >
                  {{ t('writing.all_topics') }}
                </button>
              </li>
              <li v-for="topicLabel in topics" :key="topicLabel" role="option" :aria-selected="topicFilter === topicLabel">
                <button
                  type="button"
                  class="filter-dropdown__option"
                  :class="{ active: topicFilter === topicLabel }"
                  @click="selectTopic(topicLabel)"
                >
                  {{ topicLabel }}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="type-ui text-text-secondary">{{ t('writing.sort_by') }}</span>
          <div class="flex flex-col gap-1">
            <button
              v-for="s in sorts"
              :key="s.key"
              type="button"
              class="filter-sort-btn"
              :class="{ active: sortBy === s.key }"
              @click="sortBy = s.key"
            >
              <svg v-if="s.key === 'date-desc'" class="filter-sort-btn__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2.5v9M8 11.5l3-3M8 11.5l-3-3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="s.key === 'date-asc'" class="filter-sort-btn__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 13.5v-9M8 4.5l3 3M8 4.5l-3 3" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="s.key === 'alpha'" class="filter-sort-btn__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 12.5 7.4 3.5a.6.6 0 0 1 1.2 0l3.4 9M5.6 8.5h4.8" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else class="filter-sort-btn__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2.5l1.53 3.32 3.55.4-2.65 2.5.7 3.58L8 10.6l-3.13 1.7.7-3.58-2.65-2.5 3.55-.4z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" />
              </svg>
              {{ s.label }}
            </button>
          </div>
        </div>
      </aside>

      <!-- Posts — last eight columns on desktop (column 4 sits empty between
           the two regions); two-up follows from that width directly, the same
           card the homepage uses at col-span-4 of the full twelve. -->
      <div class="col-span-4 md:col-span-8 xl:col-start-5 xl:col-span-8 min-w-0">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-grid-gap auto-rows-fr">
          <PostCard
            v-for="post in filtered"
            :key="post._id"
            :ref="setCardRef"
            :item="post"
            :data-post-id="post._id"
            class="reveal-card"
          />
        </div>

        <p v-if="filtered.length === 0" class="type-text text-text-secondary py-8">{{ t('writing.not_found') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .filter-search {
    position: relative;
    display: flex;
    align-items: center;
  }

  .filter-search svg {
    position: absolute;
    left: calc(var(--spacing) * 3);
    width: calc(var(--spacing) * 4);
    height: calc(var(--spacing) * 4);
    color: var(--color-icon-default);
    pointer-events: none;
  }

  .filter-search input {
    width: 100%;
    height: calc(var(--spacing) * 10);
    padding-inline: calc(var(--spacing) * 10) calc(var(--spacing) * 4);
    border-radius: calc(infinity * 1px);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
    color: var(--color-text-primary);
    font-size: var(--text-ui);
    transition: outline-color var(--duration-hover) var(--ease-base);
  }

  .filter-search input::placeholder {
    color: var(--color-text-secondary);
  }

  .filter-search input:focus {
    outline-color: var(--color-border-input);
  }

  /* Custom listbox rather than a native select: the panel carries its own
     border and shadow instead of the browser's, and sits a small gap below
     the trigger rather than flush against it. */
  .filter-dropdown {
    position: relative;
  }

  .filter-dropdown__trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--spacing) * 2);
    width: 100%;
    height: calc(var(--spacing) * 10);
    padding-inline: calc(var(--spacing) * 4);
    border-radius: calc(infinity * 1px);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
    color: var(--color-text-primary);
    font-size: var(--text-ui);
    font-family: inherit;
    cursor: pointer;
    transition: outline-color var(--duration-hover) var(--ease-base);
  }

  .filter-dropdown__trigger:hover,
  .filter-dropdown__trigger[aria-expanded='true'] {
    outline-color: var(--color-border-input);
  }

  .filter-dropdown__chevron {
    width: calc(var(--spacing) * 2.5);
    height: calc(var(--spacing) * 2.5);
    flex-shrink: 0;
    color: var(--color-icon-default);
    transition: transform var(--duration-hover) var(--ease-base);
  }

  .filter-dropdown__chevron.open {
    transform: rotate(180deg);
  }

  /*
   * padding-block is the air around the list; --panel-pad-y holds the same
   * value so the first and last row can cancel it out below.
   */
  .filter-dropdown__panel {
    --panel-pad-y: calc(var(--spacing) * 1.5);
    position: absolute;
    top: calc(100% + calc(var(--spacing) * 2));
    left: 0;
    right: 0;
    z-index: 20;
    overflow: hidden;
    padding-block: var(--panel-pad-y);
    border-radius: var(--radius-2xl);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
    box-shadow: var(--shadow-panel);
    list-style: none;
  }

  .filter-dropdown__option {
    position: relative;
    isolation: isolate;
    display: block;
    width: 100%;
    text-align: left;
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 4);
    font-size: var(--text-ui);
    font-family: inherit;
    color: var(--color-text-primary);
    background-color: transparent;
    cursor: pointer;
    transition: color var(--duration-hover) var(--ease-base);
  }

  /*
   * The fill lives on a pseudo rather than the row's own background: a fill
   * inset from the panel's edges reads as a mistake in this system, so the
   * first and last row stretch theirs into the panel's own padding below —
   * flush with the panel edge, clipped to its rounded corner by overflow:
   * hidden — without moving the row's box or its text.
   */
  .filter-dropdown__option::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 0;
    background-color: transparent;
    transition: background-color var(--duration-hover) var(--ease-base);
  }

  .filter-dropdown__panel > li:first-child .filter-dropdown__option::before {
    top: calc(var(--panel-pad-y) * -1);
  }

  .filter-dropdown__panel > li:last-child .filter-dropdown__option::before {
    bottom: calc(var(--panel-pad-y) * -1);
  }

  .filter-dropdown__option:hover::before {
    background-color: var(--color-surface-hover);
  }

  .filter-dropdown__option.active::before {
    background-color: var(--color-fill-strong);
  }

  .filter-dropdown__option.active {
    color: var(--color-text-inverse);
  }

  /* Same pill vocabulary as nav-link: hover fills light, the selected one
     stays on the strong fill rather than only flashing it on press. */
  .filter-sort-btn {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2.5);
    height: calc(var(--spacing) * 10);
    padding-inline: calc(var(--spacing) * 3);
    border-radius: calc(infinity * 1px);
    font-size: var(--text-ui);
    color: var(--color-text-primary);
    background-color: transparent;
    cursor: pointer;
    transition: background-color var(--duration-hover) var(--ease-base),
                color var(--duration-hover) var(--ease-base);
  }

  .filter-sort-btn__icon {
    flex-shrink: 0;
    width: calc(var(--spacing) * 4);
    height: calc(var(--spacing) * 4);
  }

  .filter-sort-btn:hover {
    background-color: var(--color-surface-hover);
  }

  .filter-sort-btn.active {
    background-color: var(--color-fill-strong);
    color: var(--color-text-inverse);
  }
}

/*
 * One transition drives every appearance — first scroll into view, and every
 * re-filter, which just drops `in` from what's on screen and lets this same
 * rule fade it back in. No reshuffle: a card that survives a filter change
 * disappears and reappears at its new grid cell rather than sliding there.
 */
.reveal-card {
  opacity: 0;
  transform: translateY(1rem);
  transition: opacity var(--duration-reveal) var(--ease-out),
              transform var(--duration-reveal) var(--ease-out);
}

.reveal-card.in {
  opacity: 1;
  transform: none;
}
</style>
