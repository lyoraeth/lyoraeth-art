<script setup lang="ts">
import type { PostItem } from '../../../server/api/posts.get'

const { t }        = useI18n()
const loc          = useLoc()
const localePath   = useLocalePath()

const { data: posts } = await useFetch('/api/posts', { default: () => [] as PostItem[] })

const featured  = computed(() => posts.value[0] ?? null)
const secondary = computed(() => (posts.value ?? []).slice(1))

const formatDate = useFormatDate()

/* ── Template refs ── */
const headRef = ref<HTMLElement | null>(null)
const featRef = ref<HTMLElement | null>(null)
const mini0   = ref<HTMLElement | null>(null)
const mini1   = ref<HTMLElement | null>(null)

const { observe } = useReveal()
onMounted(() => {
  observe(headRef.value)
  observe(featRef.value)
  observe(mini0.value)
  observe(mini1.value)
})

useGlowCard(featRef)
useGlowCard(mini0)
useGlowCard(mini1)
</script>

<template>
  <section id="writing" class="section-writing">
    <div class="sec-head reveal" ref="headRef">
      <h2>{{ t('writing.title') }}</h2>
    </div>

    <div v-if="featured" class="writing-wrap">
      <!-- Featured post -->
      <a
        :href="`/writing/${featured.slug}`"
        class="feat glass-card reveal rv-d1"
        ref="featRef"
        @click.prevent="navigateTo(`/writing/${featured.slug}`)"
      >
        <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div><div class="glare-blob-2"></div></div></div>

        <div class="feat-thumb">
          <div class="feat-thumb-media">
            <SanityPicture
              :src="featured.coverUrl"
              :alt="featured.coverAlt ?? loc(featured.title)"
              class="feat-thumb-img"
              loading="lazy"
              draggable="false"
              :width="600"
            >
              <template #placeholder>
                <svg viewBox="0 0 300 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <line x1="30" y1="200" x2="280" y2="200" stroke="#fff" stroke-opacity=".08"/>
                  <line x1="30" y1="40"  x2="30"  y2="200" stroke="#fff" stroke-opacity=".08"/>
                  <polyline points="30,160 80,100 130,140 180,80 230,120 280,70"
                    fill="none" stroke="#8B95A3" stroke-width="1.5" stroke-opacity=".35"/>
                </svg>
              </template>
            </SanityPicture>
          </div>
        </div>

        <div class="feat-body">
          <div class="feat-meta">
            <span class="mono feat-date">{{ formatDate(featured.publishedAt) }}</span>
            <span class="feat-dot"></span>
            <span class="mono">{{ t('writing.min', { n: featured.readingTime }) }}</span>
          </div>
          <h3 class="feat-title">{{ loc(featured.title) }}</h3>
          <div class="feat-tags">
            <span v-for="tag in featured.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <span class="feat-read">
            {{ t('writing.read') }} <span class="feat-arrow">→</span>
          </span>
        </div>
      </a>

      <!-- Secondary posts -->
      <div class="more-writing">
        <a
          v-for="(post, i) in secondary"
          :key="post._id"
          :href="`/writing/${post.slug}`"
          class="mini-card glass-card reveal rv-d2"
          :ref="(el) => { if (i === 0) mini0 = el as HTMLElement | null; else mini1 = el as HTMLElement | null }"
          @click.prevent="navigateTo(`/writing/${post.slug}`)"
        >
          <div class="card-glare"><div class="glare-mb"><div class="glare-blob"></div></div></div>
          <div class="mini-meta">
            <span class="mono mini-date">{{ formatDate(post.publishedAt) }}</span>
            <span class="mini-dot"></span>
            <span class="mono">{{ t('writing.min', { n: post.readingTime }) }}</span>
          </div>
          <span class="mini-title">{{ loc(post.title) }}</span>
          <span class="mini-read">
            {{ t('writing.read') }} <span class="mini-arrow">→</span>
          </span>
        </a>
      </div>
      <div class="view-all-wrap">
        <NuxtLink :to="localePath('/writing')" class="view-all">{{ t('writing.see_all') }} <span class="va-arrow">→</span></NuxtLink>
      </div>
    </div>

    <!-- Empty state while Sanity is not yet configured -->
    <p v-else class="empty-state">{{ t('writing.not_found') }}</p>
  </section>
</template>

<style scoped>
.section-writing {
  padding: clamp(4.375rem, 9vw, 8.75rem) 0;
}
.writing-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.empty-state {
  color: var(--faint);
  font-size: 0.875rem;
}
.view-all-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
.view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--ember);
  font-size: 0.9375rem;
  text-decoration: none;
}
.va-arrow {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.3s var(--ease-out-expo);
}
.view-all:hover .va-arrow { transform: translateX(0.25rem); }

/* ── Featured post ─────────────────────────────────────────────────────────── */
.feat {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  border-radius: var(--radius-card);
  text-decoration: none;
  color: inherit;
}
.feat:hover { border-color: rgba(214, 154, 106, 0.3); border-color: oklch(72% 0.1 58 / 30%); }

.feat-thumb {
  position: relative;
  min-height: 13.75rem;
  background: linear-gradient(135deg, #0c1016, #0a0d12);
  overflow: hidden;
  border-radius: var(--radius-card) 0 0 var(--radius-card);
  z-index: 2;
}
.feat-thumb svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.feat-thumb-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.feat-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.feat-body {
  padding: clamp(1.5rem, 3vw, 2.375rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.feat-meta {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  margin-bottom: 1rem;
  color: var(--faint);
}
.feat-date { font-size: 0.6875rem; }
.feat-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--faint);
  flex-shrink: 0;
}
.feat-title {
  font-size: clamp(1.25rem, 0.875rem + 1vw, 1.625rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.15;
  margin-bottom: 0.875rem;
}
.feat-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.tag {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--mist);
  padding: 0.3125rem 0.625rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: rgba(255, 255, 255, 0.02);
  background: oklch(100% 0 0 / 2%);
}
.feat-read {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.375rem;
  color: var(--ember);
  font-size: 0.875rem;
}
.feat-arrow {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.35s var(--ease-out-expo);
}
.feat:hover .feat-arrow { transform: translateX(0.3125rem); }

/* ── Mini cards ────────────────────────────────────────────────────────────── */
.more-writing {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.mini-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: var(--radius-card-sm);
  text-decoration: none;
  color: inherit;
  transition:
    opacity      var(--duration-reveal) var(--ease-out-expo),
    transform    0.25s var(--ease-out-expo),
    border-color 0.3s  var(--ease-silk);
}
.mini-card:hover {
  border-color: rgba(214, 154, 106, 0.3);
  border-color: oklch(72% 0.1 58 / 30%);
  transform: translateY(-0.1875rem);
}
.mini-meta {
  display: flex;
  gap: 0.625rem;
  align-items: center;
  color: var(--faint);
  position: relative;
  z-index: 2;
}
.mini-date { font-size: 0.65625rem; }
.mini-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--faint);
  flex-shrink: 0;
}
.mini-title {
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: -0.01em;
  line-height: 1.25;
  margin-top: auto;
  position: relative;
  z-index: 2;
}
.mini-read {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  color: var(--ember);
  font-size: 0.8125rem;
  position: relative;
  z-index: 2;
}
.mini-arrow {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.3s var(--ease-out-expo);
}
.mini-card:hover .mini-arrow { transform: translateX(0.25rem); }

@media (max-width: 42.5em) {
  .feat { grid-template-columns: 1fr; }
  .feat-thumb {
    min-height: 9.375rem;
    border-radius: var(--radius-card) var(--radius-card) 0 0;
  }
  .more-writing { grid-template-columns: 1fr; }
}
</style>
