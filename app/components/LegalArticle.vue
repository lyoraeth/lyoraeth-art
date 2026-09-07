<script setup lang="ts">
/**
 * Shell for a legal document (privacy policy, personal-data notice): back
 * link plus the rendered markdown, no cover, meta, tags, TOC, comments or
 * rating — the case study and the blog post carry those, this is bare text.
 * The markdown itself supplies the page's only heading (a top-level `#`),
 * unlike a post's body, which never contains one — its h1 is the title,
 * rendered by the page rather than parsed out of the content.
 */
defineProps<{ html: string }>()

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

function handleBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    window.close()
    navigateTo(localePath('/'))
  }
}
</script>

<template>
  <div class="flex flex-col gap-y-section-gap py-section-padding-y">
    <button type="button" class="post-nav-link" @click="handleBack">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ t('error.go_home') }}
    </button>

    <div class="post-body post-column" v-html="html" />
  </div>
</template>

<style scoped>
/* ── Prose (body) — same rules as the blog post's .post-body, plus h1 for
   the heading the markdown itself carries. ── */
.post-body {
  color: var(--color-text-primary);
  line-height: 1.5;
  hyphens: auto;
  font-kerning: normal;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* Every paragraph indents, lead included — no exceptions. */
:deep(.post-body p) { margin: 0 0 1.25rem; text-indent: 1.5em; }
:deep(.post-body p:last-child) { margin-bottom: 0; }

:deep(.post-body h1),
:deep(.post-body h2),
:deep(.post-body h3) {
  color: var(--color-text-primary);
  font-family: var(--font-display);
  font-weight: 600;
}
:deep(.post-body h1) {
  font-size: var(--text-display-2xl);
  line-height: var(--text-display-2xl--line-height);
  letter-spacing: var(--text-display-2xl--letter-spacing);
  margin: 0 0 1.5rem;
}
:deep(.post-body h2) {
  font-size: var(--text-display-xl);
  line-height: var(--text-display-xl--line-height);
  letter-spacing: var(--text-display-xl--letter-spacing);
  margin: 2.5rem 0 0.75rem;
}
:deep(.post-body h3) {
  font-size: var(--text-display-lg);
  line-height: var(--text-display-lg--line-height);
  letter-spacing: var(--text-display-lg--letter-spacing);
  margin: 2.5rem 0 0.75rem;
}

:deep(.post-body hr) {
  border: none;
  border-top: 1px solid var(--color-border-default);
  margin: 2rem 0;
}

:deep(.post-body strong) { color: var(--color-text-primary); font-weight: 600; }
:deep(.post-body em) { font-style: italic; }

:deep(.post-body blockquote) {
  border-left: 2px solid var(--color-accent-strong);
  margin: 1.75rem 0;
  padding: 0.125rem 0 0.125rem 1.25rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

:deep(.post-body code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.875em;
  background-color: var(--color-surface-hover);
  border-radius: 0.25rem;
  padding: 0.1em 0.4em;
  color: var(--color-accent-strong);
}

:deep(.post-body pre) {
  background-color: var(--color-surface-panel);
  border-radius: var(--radius-2xl);
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
:deep(.post-body pre code) {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

:deep(.post-body a) {
  color: var(--color-accent-strong);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--duration-hover) var(--ease-base);
}
:deep(.post-body a:hover) { color: var(--color-accent-strong-hover); }

/* list-style: revert — Preflight zeroes it globally, which left every
   marker invisible even though the items themselves rendered fine. */
:deep(.post-body ul),
:deep(.post-body ol) {
  list-style: revert;
  margin: 0 0 1.25rem 1.5rem;
}
:deep(.post-body li) { margin-bottom: 0.375rem; }

:deep(.post-body table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: var(--text-ui);
}
:deep(.post-body th),
:deep(.post-body td) {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border-default);
  text-align: left;
  vertical-align: top;
}
:deep(.post-body th) {
  color: var(--color-text-primary);
  font-weight: 600;
}
:deep(.post-body td) { color: var(--color-text-secondary); }
</style>
