<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{ slug: string }>()

const { data: rating } = await useFetch(`/api/rating/${props.slug}`)

const storageKey = `lyoraeth_vote_${props.slug}`
const voted = ref<'up' | 'down' | null>(null)
onMounted(() => {
  voted.value = (localStorage.getItem(storageKey) ?? null) as 'up' | 'down' | null
})

const up   = computed(() => rating.value?.up   ?? 0)
const down = computed(() => rating.value?.down ?? 0)
const total = computed(() => up.value - down.value)

const totalClass = computed(() => {
  if (total.value > 0) return 'positive'
  if (total.value < 0) return 'negative'
  return 'neutral'
})

async function vote(dir: 'up' | 'down') {
  if (voted.value) return
  try {
    await $fetch(`/api/rating/${props.slug}`, { method: 'POST', body: { dir } })
    voted.value = dir
    localStorage.setItem(storageKey, dir)
    if (rating.value) {
      rating.value = {
        up:   rating.value.up   + (dir === 'up'   ? 1 : 0),
        down: rating.value.down + (dir === 'down' ? 1 : 0),
      }
    }
  } catch (e: any) {
    // 409 = уже проголосовал (IP dedup на сервере, но localStorage был сброшен)
    if (e?.response?.status === 409 || e?.statusCode === 409) {
      voted.value = dir
      localStorage.setItem(storageKey, dir)
    }
  }
}
</script>

<template>
  <div class="rating">
    <div class="rating-row">
      <button
        type="button"
        class="vote-btn vote-up"
        :class="{ chosen: voted === 'up' }"
        :disabled="!!voted"
        :aria-label="t('post.rating.upvote')"
        :aria-pressed="voted === 'up'"
        @click="vote('up')"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3l5 6H3l5-6z" fill="currentColor"/>
        </svg>
      </button>

      <span class="rating-total" :class="totalClass">
        {{ total > 0 ? '+' : '' }}{{ total }}
      </span>

      <button
        type="button"
        class="vote-btn vote-down"
        :class="{ chosen: voted === 'down' }"
        :disabled="!!voted"
        :aria-label="t('post.rating.downvote')"
        :aria-pressed="voted === 'down'"
        @click="vote('down')"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 13L3 7h10l-5 6z" fill="currentColor"/>
        </svg>
      </button>
    </div>

    <p v-if="voted" class="rated-note">{{ t('post.rating.voted') }}</p>
    <p v-else class="rate-prompt">{{ t('post.rating.prompt') }}</p>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .rating {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: calc(var(--spacing) * 3);
    padding: calc(var(--spacing) * 6) 0;
  }

  .rating-row {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 3.5);
  }

  /* Same shape as the header's icon-button: round, outlined, a hover fill —
     the vertical icon-over-count pill it replaced didn't match anything
     else the site draws a vote-style control with. */
  .vote-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: calc(var(--spacing) * 9);
    height: calc(var(--spacing) * 9);
    border-radius: calc(infinity * 1px);
    outline: 1px solid var(--color-border-default);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color var(--duration-hover) var(--ease-base),
                outline-color var(--duration-hover) var(--ease-base),
                background-color var(--duration-hover) var(--ease-base);
  }

  .vote-btn svg {
    width: calc(var(--spacing) * 3);
    height: calc(var(--spacing) * 3);
  }

  .vote-btn:not(:disabled):hover {
    color: var(--color-text-primary);
    background-color: var(--color-surface-hover);
  }

  .vote-btn:disabled { cursor: default; opacity: 0.4; }

  /* The chosen side stays on the same strong fill the rest of the site uses
     for a deliberate, settled choice — the disabled sibling just dims. No
     outline here: one drawn in the same color as the fill it borders still
     rasterizes as a separate stroke, which left a hairline sliver of the
     page showing through between the two on a circle this small. */
  .vote-up.chosen {
    color: var(--color-text-inverse);
    outline: none;
    background-color: var(--color-accent-strong);
    opacity: 1;
  }

  .vote-down.chosen {
    color: var(--color-text-inverse);
    outline: none;
    background-color: oklch(58% 0.15 270);
    opacity: 1;
  }

  .rating-total {
    min-width: 3ch;
    text-align: center;
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    transition: color var(--duration-hover) var(--ease-base);
  }
  .rating-total.positive { color: var(--color-accent-strong); }
  .rating-total.negative { color: oklch(58% 0.15 270); }
  .rating-total.neutral  { color: var(--color-text-decorative); }

  .rate-prompt, .rated-note {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--text-ui);
  }
}
</style>
