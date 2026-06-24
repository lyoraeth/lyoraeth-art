<script setup lang="ts">
import type { CommentItem } from '../../../server/api/comments/[slug].get'

const { t } = useI18n()
const plural = usePlural()
const props = defineProps<{ slug: string; postTitle: string }>()

const { data: comments, refresh } = await useFetch<CommentItem[]>(`/api/comments/${props.slug}`)

const token   = ref('')
const name    = ref('')
const email   = ref('')
const message = ref('')

type State = 'idle' | 'loading' | 'success' | 'error'
const state  = ref<State>('idle')
const errMsg = ref('')

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function emailNick(e: string) {
  return e.split('@')[0]
}

async function submit() {
  if (!name.value.trim() || !email.value.trim() || !message.value.trim() || !token.value) return
  state.value = 'loading'
  errMsg.value = ''
  try {
    await $fetch('/api/comment', {
      method: 'POST',
      body: {
        token:    token.value,
        name:     name.value,
        email:    email.value,
        message:  message.value,
        postSlug: props.slug,
      },
    })
    state.value = 'success'
    name.value = email.value = message.value = token.value = ''
    await refresh()
  } catch (e: any) {
    errMsg.value = e?.data?.message ?? t('post.comments.error')
    state.value = 'error'
    token.value = ''
  }
}
</script>

<template>
  <div class="comments">

    <!-- Existing comments -->
    <div v-if="comments?.length" class="comment-list">
      <h3 class="comments-title">{{ t(`post.comments.count_${plural(comments.length)}`, { n: comments.length }) }}</h3>
      <div v-for="c in comments" :key="c._id" class="comment-item">
        <div class="comment-header">
          <div class="comment-avatar" :aria-label="c.name">
            {{ (c.name[0] ?? '?').toUpperCase() }}
          </div>
          <div class="comment-meta">
            <span class="comment-name">{{ c.name }}</span>
            <span class="comment-nick">@{{ emailNick(c.email) }}</span>
          </div>
          <span class="comment-date">{{ formatDate(c.publishedAt) }}</span>
        </div>
        <p class="comment-body">{{ c.message }}</p>
      </div>
    </div>

    <!-- Form -->
    <div class="comment-form-wrap">
      <h3 class="comments-title">{{ comments?.length ? t('post.comments.reply') : t('post.comments.first') }}</h3>

      <div v-if="state === 'success'" class="success-msg" aria-live="polite">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {{ t('post.comments.success') }}
        <button class="another-btn" @click="state = 'idle'">{{ t('post.comments.another') }}</button>
      </div>

      <form v-else class="comment-form" @submit.prevent="submit">
        <div class="fields-row">
          <div class="field">
            <label class="field-label" for="c-name">{{ t('post.comments.name') }}</label>
            <input id="c-name" v-model="name" class="field-input" type="text"
              autocomplete="name" required :placeholder="t('post.comments.name_placeholder')" />
          </div>
          <div class="field">
            <label class="field-label" for="c-email">
              {{ t('post.comments.email') }} <span class="field-hint">{{ t('post.comments.email_hint') }}</span>
            </label>
            <input id="c-email" v-model="email" class="field-input" type="email"
              autocomplete="email" required :placeholder="t('post.comments.email_placeholder')" />
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="c-msg">{{ t('post.comments.message') }}</label>
          <textarea id="c-msg" v-model="message" class="field-input field-textarea"
            required rows="4" :placeholder="t('post.comments.message_placeholder')" />
        </div>

        <NuxtTurnstile v-model="token" class="turnstile" />

        <p v-if="state === 'error'" class="err-msg">{{ errMsg }}</p>

        <button type="submit" class="submit-btn" :disabled="state === 'loading' || !token">
          <span v-if="state === 'loading'" class="loading-dot"></span>
          <span v-else>{{ t('post.comments.submit') }}</span>
        </button>
      </form>
    </div>

  </div>
</template>

<style scoped>
.comments { display: flex; flex-direction: column; gap: 2rem; }

.comments-title {
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 1.25rem;
}

/* ── Existing comments ── */
.comment-list { display: flex; flex-direction: column; gap: 0; }

.comment-item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--line-soft);
}
.comment-item:first-of-type { border-top: 1px solid var(--line-soft); }

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.comment-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--ember-bg);
  border: 1px solid var(--ember-border);
  color: var(--ember);
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.comment-meta {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
}
.comment-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--snow);
}
.comment-nick {
  font-size: 0.75rem;
  color: var(--faint);
  font-family: 'JetBrains Mono', monospace;
}
.comment-date {
  font-size: 0.6875rem;
  color: var(--faint);
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
}
.comment-body {
  font-size: 0.9375rem;
  color: var(--ink);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Form ── */
.comment-form-wrap { }
.comment-form { display: flex; flex-direction: column; gap: 1rem; }
.fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--faint);
}
.field-hint {
  text-transform: none;
  letter-spacing: 0;
  font-family: inherit;
  font-size: 0.6875rem;
  color: var(--faint);
  opacity: 0.7;
}
.field-input {
  background: oklch(100% 0 0 / 3%);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-tag);
  padding: 0.5625rem 0.75rem;
  font-family: inherit;
  font-size: 0.9375rem;
  color: var(--snow);
  transition: border-color 0.2s;
  resize: none;
}
.field-input::placeholder { color: var(--faint); }
.field-input:focus { border-color: oklch(72% 0.1 58 / 40%); }
.field-input:focus-visible { outline: 2px solid oklch(72% 0.1 58 / 60%); outline-offset: -1px; }
.field-textarea { min-height: 7rem; line-height: 1.6; }

.turnstile { margin-top: 0.25rem; }

.submit-btn {
  align-self: flex-start;
  padding: 0.5625rem 1.5rem;
  background: var(--ember-bg);
  border: 1px solid var(--ember-border);
  border-radius: var(--radius-tag);
  color: var(--ember);
  font-size: 0.9375rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
}
.submit-btn:hover:not(:disabled) { background: oklch(72% 0.1 58 / 15%); }
.submit-btn:disabled { opacity: 0.5; cursor: default; }

.err-msg { font-size: 0.8125rem; color: oklch(65% 0.14 270); }

.success-msg {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: oklch(72% 0.12 150);
  font-size: 0.9375rem;
  flex-wrap: wrap;
}
.success-msg svg { width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
.another-btn {
  color: var(--faint);
  font-size: 0.8125rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.loading-dot {
  display: inline-block;
  width: 0.5rem; height: 0.5rem;
  border-radius: 50%;
  background: var(--ember);
  animation: blink 0.8s ease-in-out infinite alternate;
}
@keyframes blink { from { opacity: 0.3; } to { opacity: 1; } }

@media (max-width: 36rem) {
  .fields-row { grid-template-columns: 1fr; }
}
</style>
