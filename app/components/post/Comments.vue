<script setup lang="ts">
import type { CommentItem } from '../../../server/api/comments/[slug].get'

const { t } = useI18n()
const plural = usePlural()
const props = defineProps<{ slug: string; postTitle: string }>()

const track = useTrack()
let commentStarted = false
function onCommentStart() {
  if (commentStarted) return
  commentStarted = true
  track(EV.commentStart, { slug: props.slug })
}

const { data: comments, refresh } = await useFetch<CommentItem[]>(`/api/comments/${props.slug}`)

const token    = ref('')
const nick     = ref('')
const message  = ref('')
const consent  = ref(false)

type State = 'idle' | 'loading' | 'success' | 'error'
const state    = ref<State>('idle')
const errMsg   = ref('')
const attempted = ref(false)

const ve = computed(() => ({
  nick:    attempted.value && !nick.value.trim(),
  message: attempted.value && !message.value.trim(),
  consent: attempted.value && !consent.value,
}))

// The site-wide date formatter, locale-aware — this used to be a local
// reimplementation hardcoded to en-GB, so a comment's date showed in English
// even on the ru site while every other date on the page followed the
// active locale.
const formatDate = useFormatDate()

const localePath = useLocalePath()
const turnstile = ref<{ reset: () => void } | null>(null)

async function submit() {
  attempted.value = true
  if (!nick.value.trim() || !message.value.trim() || !token.value || !consent.value) return
  attempted.value = false
  state.value = 'loading'
  errMsg.value = ''
  try {
    await $fetch('/api/comment', {
      method: 'POST',
      body: {
        token:    token.value,
        nick:     nick.value,
        message:  message.value,
        postSlug: props.slug,
      },
    })
    state.value = 'success'
    nick.value = message.value = ''
    consent.value = false
    await refresh() // pull the just-posted comment into the list above
  }
  catch (e) {
    // $fetch errors don't have a single, documented shape — a narrow local
    // cast is the pragmatic middle ground between `any` and writing out
    // ofetch's internal error types by hand.
    const err = e as { data?: { message?: string } }
    errMsg.value = err?.data?.message ?? t('post.comments.error')
    state.value = 'error'
  }
  finally {
    // A token is single-use, on success or failure alike: clearing it alone
    // leaves the widget itself showing a stale solved state for a token
    // that's already spent — reset() re-renders it so the next comment (a
    // retry, or another one after "написать ещё") gets a real one.
    token.value = ''
    turnstile.value?.reset()
  }
}
</script>

<template>
  <div class="comments">

    <!-- Existing comments -->
    <div v-if="comments?.length" class="comment-list">
      <h3 class="comments-title type-display-md text-text-primary">{{ t(`post.comments.count_${plural(comments.length)}`, { n: comments.length }) }}</h3>
      <div v-for="c in comments" :key="c._id" class="comment-item">
        <div class="comment-header">
          <div class="comment-avatar type-ui">
            {{ (c.nick[0] ?? '?').toUpperCase() }}
          </div>
          <span class="comment-nick type-ui text-text-secondary">@{{ c.nick }}</span>
          <span class="comment-date type-ui text-text-decorative">{{ formatDate(c.publishedAt, 'medium') }}</span>
        </div>
        <p class="comment-body type-text text-text-primary">{{ c.message }}</p>
      </div>
    </div>

    <!-- Form -->
    <div class="comment-form-wrap">
      <h3 class="comments-title type-display-md text-text-primary">{{ comments?.length ? t('post.comments.reply') : t('post.comments.first') }}</h3>

      <div v-if="state === 'success'" class="success-msg type-text" aria-live="polite">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {{ t('post.comments.success') }}
        <button type="button" class="another-btn type-ui text-text-secondary" @click="state = 'idle'">{{ t('post.comments.another') }}</button>
      </div>

      <form v-else class="comment-form" novalidate @submit.prevent="submit" @focusin="onCommentStart">
        <div class="field">
          <label class="type-ui text-text-primary" for="c-nick">{{ t('post.comments.nick') }}</label>
          <input id="c-nick" v-model="nick" class="field-input" type="text"
            :class="{ 'is-error': ve.nick }"
            autocomplete="nickname" :placeholder="t('post.comments.nick_placeholder')" >
          <p v-if="ve.nick" class="type-ui text-text-critical" aria-live="polite">{{ t('form.required') }}</p>
        </div>

        <div class="field">
          <label class="type-ui text-text-primary" for="c-msg">{{ t('post.comments.message') }}</label>
          <textarea id="c-msg" v-model="message" class="field-input field-textarea"
            :class="{ 'is-error': ve.message }"
            rows="4" :placeholder="t('post.comments.message_placeholder')" />
          <p v-if="ve.message" class="type-ui text-text-critical" aria-live="polite">{{ t('form.required') }}</p>
        </div>

        <NuxtTurnstile ref="turnstile" v-model="token" appearance="invisible" />

        <p v-if="state === 'error'" class="type-text text-text-critical">{{ errMsg }}</p>

        <label class="consent-label type-ui" :class="ve.consent ? 'text-text-critical' : 'text-text-secondary'">
          <input v-model="consent" type="checkbox" class="consent-check" >
          <i18n-t keypath="post.comments.consent" tag="span" scope="global">
            <template #consent>
              <NuxtLink :to="localePath('/personal-data')" target="_blank" class="consent-link">{{ t('post.comments.consent_link') }}</NuxtLink>
            </template>
            <template #policy>
              <NuxtLink :to="localePath('/privacy')" target="_blank" class="consent-link">{{ t('post.comments.policy_link') }}</NuxtLink>
            </template>
          </i18n-t>
        </label>
        <p v-if="ve.consent" class="type-ui text-text-critical" aria-live="polite">{{ t('form.required_consent') }}</p>

        <button type="submit" class="submit-btn type-ui" :disabled="state === 'loading' || !token">
          <span v-if="state === 'loading'" class="loading-dot"/>
          <span v-else>{{ t('post.comments.submit') }}</span>
        </button>
      </form>
    </div>

  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .comments { display: flex; flex-direction: column; gap: calc(var(--spacing) * 8); }

  .comments-title {
    margin-bottom: calc(var(--spacing) * 5);
  }

  /* ── Existing comments ── */
  .comment-list { display: flex; flex-direction: column; gap: 0; }

  .comment-item {
    padding: calc(var(--spacing) * 5) 0;
    border-bottom: 1px solid var(--color-border-default);
  }
  .comment-item:first-of-type { border-top: 1px solid var(--color-border-default); }

  .comment-header {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 3);
    margin-bottom: calc(var(--spacing) * 3);
  }
  .comment-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: 50%;
    background-color: var(--color-surface-hover);
    color: var(--color-accent-strong);
    font-weight: 600;
  }
  .comment-nick { flex: 1; }
  .comment-date { flex-shrink: 0; }
  .comment-body {
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ── Form ── */
  .comment-form { display: flex; flex-direction: column; gap: calc(var(--spacing) * 4); }

  .field { display: flex; flex-direction: column; gap: calc(var(--spacing) * 1.5); }
  .field-input {
    padding: calc(var(--spacing) * 2.25) calc(var(--spacing) * 3);
    border-radius: var(--radius-2xl);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: var(--text-text);
    transition: outline-color var(--duration-hover) var(--ease-out);
    resize: none;
  }
  .field-input::placeholder { color: var(--color-text-secondary); }
  .field-input:focus { outline-color: var(--color-border-input); }
  .field-input.is-error { outline-color: var(--color-text-critical); }
  .field-textarea { min-height: 7rem; line-height: 1.6; }

  p[aria-live='polite'] { margin: calc(var(--spacing) * 1) 0 0; }

  .submit-btn {
    align-self: flex-start;
    margin-top: calc(var(--spacing) * 1);
    height: calc(var(--spacing) * 10);
    padding-inline: calc(var(--spacing) * 6);
    border-radius: calc(infinity * 1px);
    background-color: var(--color-fill-strong);
    color: var(--color-text-inverse);
    font-family: inherit;
    cursor: pointer;
    transition: background-color var(--duration-hover) var(--ease-out);
  }
  .submit-btn:hover:not(:disabled) { background-color: var(--color-accent-strong-hover); }
  .submit-btn:active:not(:disabled) { background-color: var(--color-accent-default); }
  .submit-btn:disabled { opacity: 0.5; cursor: default; }

  .consent-label {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--spacing) * 2);
    line-height: 1.5;
    cursor: pointer;
  }
  .consent-check {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    margin-top: 0.2rem;
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
    outline: 1px solid var(--color-border-input);
    background-color: var(--color-surface-field);
    cursor: pointer;
    appearance: none;
    transition: outline-color var(--duration-hover) var(--ease-out),
                background-color var(--duration-hover) var(--ease-out);
  }
  .consent-check:hover { outline-color: var(--color-accent-strong); }
  .consent-check::before {
    content: '';
    width: 0.3125rem;
    height: 0.5rem;
    margin-top: -0.0625rem;
    border: 1.5px solid var(--color-text-inverse);
    border-top: none;
    border-left: none;
    transform: rotate(45deg) scale(0);
    transition: transform 0.15s ease;
  }
  .consent-check:checked {
    background-color: var(--color-fill-strong);
    outline-color: var(--color-fill-strong);
  }
  .consent-check:checked::before { transform: rotate(45deg) scale(1); }
  .consent-check:focus-visible {
    outline: 2px solid var(--color-accent-default);
    outline-offset: 2px;
  }
  .consent-link {
    color: var(--color-accent-strong);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--duration-hover) var(--ease-out);
  }
  .consent-link:hover { color: var(--color-accent-strong-hover); }

  .success-msg {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2.5);
    flex-wrap: wrap;
    color: oklch(60% 0.14 150);
  }
  .success-msg svg { width: calc(var(--spacing) * 5); height: calc(var(--spacing) * 5); flex-shrink: 0; }
  .another-btn {
    padding: 0;
    border: none;
    background: none;
    text-decoration: underline;
    cursor: pointer;
  }

  .loading-dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--color-text-inverse);
    animation: blink 0.8s ease-in-out infinite alternate;
  }
  @keyframes blink { from { opacity: 0.3; } to { opacity: 1; } }
}
</style>
