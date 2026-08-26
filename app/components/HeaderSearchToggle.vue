<script setup lang="ts">
/**
 * Phone search: a round button that unrolls into a field. The magnifier stays
 * at the left edge, the field appears behind it, and the grid decides how wide
 * the open state gets.
 */
const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const query = ref('')

function onButtonClick() {
  if (!open.value) {
    open.value = true
    nextTick(() => input.value?.focus())
    return
  }
  // once unrolled, the magnifier acts as the submit button
  if (query.value) submit()
}

function submit() {
  // Search results are a stage of their own; the field is markup for now.
}

// a click outside collapses it, but never discards typed text
function onDocumentClick(event: MouseEvent) {
  if (!open.value || query.value) return
  if (!root.value?.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || query.value) return
  open.value = false
  root.value?.querySelector('button')?.focus()
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <form
    ref="root"
    role="search"
    class="search-toggle lg:hidden"
    :data-open="open || undefined"
    @submit.prevent="submit"
  >
    <button
      type="button"
      :aria-label="t('search.toggle')"
      :aria-expanded="open"
      aria-controls="mobile-search-input"
      @click="onButtonClick"
    >
      <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path
          d="M12.19 7.238a4.952 4.952 0 0 0-8.48-3.546A4.95 4.95 0 0 0 2.285 7.24a4.953 4.953 0 0 0 9.906-.002m2.287 0a7.2 7.2 0 0 1-1.379 4.244l2.567 2.567a1.144 1.144 0 1 1-1.616 1.616l-2.567-2.567a7.2 7.2 0 0 1-4.244 1.379 7.239 7.239 0 1 1 7.239-7.239"
        />
      </svg>
    </button>

    <label for="mobile-search-input" class="sr-only">{{ t('search.label') }}</label>
    <input
      id="mobile-search-input"
      ref="input"
      v-model="query"
      name="q"
      type="search"
      :placeholder="t('search.placeholder')"
      :tabindex="open ? 0 : -1"
      class="w-full bg-transparent pr-3 text-ui placeholder:text-text-secondary focus:outline-none"
      @keydown="onKeydown"
    >
  </form>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /*
   * Unrolling is animated with flex-grow alone rather than width plus flex: on
   * collapse, flex-shrink drops to zero instantly, so the element expands to its
   * declared full width for one frame before travelling back.
   */
  .search-toggle {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    width: calc(var(--spacing) * 10);
    height: calc(var(--spacing) * 10);
    border-radius: calc(infinity * 1px);
    outline: 1px solid var(--color-border-default);
    overflow: hidden;
    transition: flex-grow var(--duration-hover) var(--ease-base),
                background-color var(--duration-hover) var(--ease-base),
                outline-color var(--duration-hover) var(--ease-base);
  }

  /* the circle only lights up while it's still a circle */
  .search-toggle:hover:not([data-open]) {
    background-color: var(--color-surface-hover);
  }

  .search-toggle[data-open] {
    flex-grow: 1;
    background-color: var(--color-surface-hover-strong);
    outline-color: var(--color-border-input);
  }

  /*
   * The magnifier behaves the same in both states and exactly as on desktop —
   * only its color changes. No press fill: the reaction to a press here is the
   * field unrolling, and a fill wouldn't be seen anyway.
   */
  .search-toggle button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: calc(var(--spacing) * 10);
    height: calc(var(--spacing) * 10);
    color: var(--color-icon-default);
    cursor: pointer;
    transition: color var(--duration-hover) var(--ease-base);
  }

  .search-toggle button:hover { color: var(--color-text-secondary); }

  .search-toggle button:active {
    color: var(--color-accent-strong);
    transition-duration: var(--duration-press);
  }

  .search-toggle input {
    min-width: 0;
    opacity: 0;
    transition: opacity var(--duration-hover) var(--ease-base);
  }

  .search-toggle[data-open] input {
    opacity: 1;
  }
}
</style>
