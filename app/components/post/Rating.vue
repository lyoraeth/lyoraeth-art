<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{ slug: string }>()

const { data: rating, refresh } = await useFetch(`/api/rating/${props.slug}`)

const voted = ref<'up' | 'down' | null>(null)
onMounted(() => {
  voted.value = localStorage.getItem(`lyoraeth_vote_${props.slug}`) as 'up' | 'down' | null
})

const up   = computed(() => rating.value?.up   ?? 0)
const down = computed(() => rating.value?.down ?? 0)
const total = computed(() => up.value - down.value)
const totalVotes = computed(() => up.value + down.value)
const upRatio = computed(() => totalVotes.value > 0 ? up.value / totalVotes.value : 0.5)

const totalClass = computed(() => {
  if (total.value > 0) return 'positive'
  if (total.value < 0) return 'negative'
  return 'neutral'
})

async function vote(dir: 'up' | 'down') {
  if (voted.value) return
  await $fetch(`/api/rating/${props.slug}`, { method: 'POST', body: { dir } })
  localStorage.setItem(`lyoraeth_vote_${props.slug}`, dir)
  voted.value = dir
  await refresh()
}
</script>

<template>
  <div class="rating">
    <div class="rating-row">
      <button
        class="vote-btn vote-up"
        :class="{ active: voted === 'up', disabled: !!voted }"
        :disabled="!!voted"
        :aria-label="'Upvote'"
        @click="vote('up')"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 3l5 6H3l5-6z" fill="currentColor"/>
        </svg>
        <span>{{ up }}</span>
      </button>

      <span class="rating-total" :class="totalClass">
        {{ total > 0 ? '+' : '' }}{{ total }}
      </span>

      <button
        class="vote-btn vote-down"
        :class="{ active: voted === 'down', disabled: !!voted }"
        :disabled="!!voted"
        :aria-label="'Downvote'"
        @click="vote('down')"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 13L3 7h10l-5 6z" fill="currentColor"/>
        </svg>
        <span>{{ down }}</span>
      </button>
    </div>

    <div class="rating-bar" :title="`${up} up · ${down} down`">
      <div class="bar-fill" :style="{ width: `${upRatio * 100}%` }"></div>
    </div>

    <p v-if="voted" class="rated-note">{{ t('post.rating.voted') }}</p>
    <p v-else class="rate-prompt">{{ t('post.rating.prompt') }}</p>
  </div>
</template>

<style scoped>
.rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.vote-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  background: oklch(100% 0 0 / 3%);
  color: var(--mist);
  font-size: 0.6875rem;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.vote-btn svg {
  width: 0.625rem;
  height: 0.625rem;
}
.vote-btn:not(.disabled):hover {
  color: var(--snow);
  border-color: var(--line);
  background: oklch(100% 0 0 / 6%);
}
.vote-btn.disabled { cursor: default; opacity: 0.5; }
.vote-up.active  { color: var(--ember); border-color: var(--ember-border); background: var(--ember-bg); opacity: 1; }
.vote-down.active { color: oklch(65% 0.14 270); border-color: oklch(65% 0.14 270 / 30%); background: oklch(65% 0.14 270 / 8%); opacity: 1; }

.rating-total {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  min-width: 3ch;
  text-align: center;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}
.rating-total.positive { color: var(--ember); }
.rating-total.negative { color: oklch(65% 0.14 270); }
.rating-total.neutral  { color: var(--faint); }

.rating-bar {
  width: 8rem;
  height: 3px;
  background: oklch(65% 0.14 270 / 25%);
  border-radius: 2px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--ember);
  border-radius: 2px;
  transition: width 0.5s var(--ease-out-expo);
}

.rate-prompt, .rated-note {
  font-size: 0.75rem;
  color: var(--faint);
  margin: 0;
}
</style>
