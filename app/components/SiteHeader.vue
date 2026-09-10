<script setup lang="ts">
/**
 * Header of the light shell: brand, navigation with search, language and CV,
 * and the phone menu it owns.
 */
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const menuOpen = defineModel<boolean>('menuOpen', { default: false })
const searchOpen = ref(false)
const burger = ref<HTMLButtonElement | null>(null)
const query = ref('')

const { ensureLoaded, search, ready: searchReady, minQueryLength } = useSiteSearch()
const searchRoot = ref<HTMLElement | null>(null)
const resultsOpen = ref(false)
const searchGroups = computed(() => search(query.value))
// gated on searchReady too — otherwise a keystroke right after focus can flash
// "nothing found" for the instant before the catalog fetch resolves
const showResults = computed(() =>
  resultsOpen.value && searchReady.value && query.value.trim().length >= minQueryLength)

function onSearchFocus() {
  resultsOpen.value = true
  ensureLoaded()
}

function closeResults() {
  resultsOpen.value = false
}

const isHome = computed(() => {
  const home = localePath('/')
  return route.path === home || route.path === home.replace(/\/$/, '')
})

/** Section anchor while on the home page, the standalone page elsewhere. */
function navTo(hash: string, page?: string) {
  if (isHome.value) return `#${hash}`
  if (page) return localePath(page)
  return `${localePath('/')}#${hash}`
}

const links = computed(() => [
  { label: t('nav.work'), to: navTo('work', '/work') },
  { label: t('nav.experience'), to: navTo('experience') },
  { label: t('nav.writing'), to: navTo('writing', '/writing') },
  { label: t('nav.contact'), to: navTo('contact') },
])

function submitSearch() {
  const g = searchGroups.value
  const first = g.work[0] ?? g.writing[0] ?? g.pages[0]
  if (first) navigateTo(first.href)
  closeResults()
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  // the two never sit open at once
  if (menuOpen.value) searchOpen.value = false
}

// The reverse direction: the mobile search toggle sits in the header bar,
// above where the menu panel covers, so it stays tappable while the menu is
// open — opening it from there has to close the menu itself, not just rely
// on toggleMenu()'s side of the exclusion.
watch(searchOpen, open => {
  if (open) menuOpen.value = false
})

// Escape closes from anywhere, and focus returns to the burger
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (resultsOpen.value) {
    closeResults()
    return
  }
  if (!menuOpen.value) return
  menuOpen.value = false
  burger.value?.focus()
}

function onDocumentClick(event: MouseEvent) {
  if (!resultsOpen.value) return
  if (!searchRoot.value?.contains(event.target as Node)) closeResults()
}

let desktop: MediaQueryList | undefined
// the menu doesn't exist on desktop, so its state must not survive the switch
const onDesktopChange = (event: MediaQueryListEvent) => {
  if (event.matches) menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onDocumentClick)
  desktop = matchMedia('(width >= 64rem)')
  desktop.addEventListener('change', onDesktopChange)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocumentClick)
  desktop?.removeEventListener('change', onDesktopChange)
})
</script>

<template>
  <header class="header bg-surface-header border-b border-b-border-default">
    <!-- Columns: four below 768, eight up to 1024, twelve above. -->
    <div class="header-bar wrapper px-page-padding-x h-28 layout-grid">
      <div class="flex items-center col-span-1 md:col-span-4 lg:col-span-1 xl:col-span-4">
        <NuxtLink :to="localePath('/')" class="inline-flex items-center" :aria-label="t('nav.brand')">
          <img src="/logo/full-logo-light.svg" alt="" class="h-3.25 w-[4.6081rem]">
        </NuxtLink>
      </div>

      <nav
        class="hidden lg:flex items-center gap-1 lg:col-span-5 xl:col-span-6 2xl:col-span-4"
        :aria-label="t('nav.site_nav')"
      >
        <ul class="flex flex-row gap-1">
          <li v-for="link in links" :key="link.to">
            <NuxtLink :to="link.to" class="nav-link">{{ link.label }}</NuxtLink>
          </li>
        </ul>

        <!--
          Search is not a navigation item, hence role="search" instead of a place
          in the list; it sits inside nav only to take a grid column, and the
          grid is what gives it width.
        -->
        <form
          ref="searchRoot"
          role="search"
          class="interactive relative flex h-10 w-full items-center gap-2.5 rounded-full px-3 hover:bg-surface-hover-strong focus-within:bg-surface-hover-strong focus-within:outline-1 focus-within:outline-border-input"
          @submit.prevent="submitSearch"
        >
          <!-- the 44x44 tap target is drawn by a pseudo-element, so it doesn't
               shift the icon or the field -->
          <button
            type="submit"
            :aria-label="t('search.submit')"
            class="interactive relative flex shrink-0 cursor-pointer items-center justify-center text-icon-default hover:text-text-secondary active:text-accent-strong after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-[calc(50%+.3125rem)] after:-translate-y-1/2 after:content-['']"
          >
            <svg class="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M12.19 7.238a4.952 4.952 0 0 0-8.48-3.546A4.95 4.95 0 0 0 2.285 7.24a4.953 4.953 0 0 0 9.906-.002m2.287 0a7.2 7.2 0 0 1-1.379 4.244l2.567 2.567a1.144 1.144 0 1 1-1.616 1.616l-2.567-2.567a7.2 7.2 0 0 1-4.244 1.379 7.239 7.239 0 1 1 7.239-7.239"
              />
            </svg>
          </button>

          <label for="site-search" class="sr-only">{{ t('search.label') }}</label>
          <input
            id="site-search"
            v-model="query"
            name="q"
            type="search"
            :placeholder="t('search.placeholder')"
            autocomplete="off"
            aria-haspopup="listbox"
            :aria-expanded="showResults"
            class="w-full bg-transparent text-ui placeholder:text-text-secondary focus:outline-none"
            @focus="onSearchFocus"
            @input="resultsOpen = true"
          >

          <SearchResults v-if="showResults" :groups="searchGroups" @select="closeResults" />
        </form>
      </nav>

      <div class="flex items-center justify-end gap-1 col-span-3 md:col-span-4 lg:col-span-2 2xl:col-span-4">
        <LangButton class="hidden lg:inline-flex" />
        <CvButton class="hidden lg:inline-flex" />

        <HeaderSearchToggle v-model:open="searchOpen" />

        <button
          ref="burger"
          type="button"
          :aria-label="menuOpen ? t('nav.menu_close') : t('nav.menu_open')"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          class="icon-button lg:hidden"
          @click="toggleMenu"
        >
          <svg
            class="w-3.5 h-2.5"
            viewBox="0 0 14 10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path class="burger-line burger-top" d="M.75.75h12" />
            <path class="burger-line burger-middle" d="M.75 4.75h12" />
            <path class="burger-line burger-bottom" d="M.75 8.75h12" />
          </svg>
        </button>
      </div>
    </div>

    <MobileMenu v-model:open="menuOpen" :links="links" />
  </header>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /*
   * The header as a whole sits above the content. position is required: z-index
   * does nothing on a static element.
   *
   * The menu is its child, so their order is settled inside the header's own
   * stacking context — the bar gets the higher layer and stays on top while the
   * panel slides out from under it.
   */
  .header {
    /* sticky rather than fixed: the header then occupies its height in flow and
       the content below doesn't have to be pushed down */
    position: sticky;
    /* clears the maintenance strip when it's up (SiteNotice sets --notice-h) */
    top: var(--notice-h, 0px);
    z-index: 40;
  }

  .header-bar {
    position: relative;
    z-index: 2;
    background-color: var(--color-surface-header);
  }

  /*
   * The burger morphs into a cross: the outer strokes slide to the middle and
   * rotate, the middle one collapses. transform-box makes the stroke itself the
   * origin — otherwise rotation is measured from the viewBox corner and the lines
   * drift apart.
   */
  .burger-line {
    transform-box: fill-box;
    transform-origin: center;
    transition: translate var(--duration-menu) var(--ease-out),
                rotate var(--duration-menu) var(--ease-out),
                opacity var(--duration-menu) var(--ease-out);
  }

  [aria-expanded='true'] .burger-top {
    translate: 0 4px;
    rotate: 45deg;
  }

  [aria-expanded='true'] .burger-middle {
    opacity: 0;
  }

  [aria-expanded='true'] .burger-bottom {
    translate: 0 -4px;
    rotate: -45deg;
  }
}
</style>
