export interface TocEntry { id: string; text: string; level: 2 | 3 | 'intro' }

/** Table of contents for a markdown article: builds the entry list from the
 *  raw source, tracks which heading is active, and positions the mobile panel
 *  / clamps the fixed desktop sidebar. Owns its own scroll + resize listeners.
 *
 *  `content` is the rendered HTML — watched so the active id / clamp re-measure
 *  once the new body has hit the DOM (e.g. after a locale switch). */
export function useToc(opts: {
  markdown:   () => string
  introLabel: () => string
  content:    () => string
}) {
  const toc = computed<TocEntry[]>(() => {
    const raw = opts.markdown()
    if (!raw) return []
    const entries: TocEntry[] = []

    entries.push({ level: 'intro', text: opts.introLabel(), id: 'post-body-start' })

    const re = /^(#{2,3})\s+(.+)$/gm
    let m
    while ((m = re.exec(raw)) !== null) {
      const text = m[1] ? m[2]?.trim() ?? '' : ''
      if (text) entries.push({ level: m[1]!.length as 2 | 3, text, id: slugifyHeading(text) })
    }
    return entries
  })

  const activeId      = ref('')
  const tocOpen       = ref(false)
  const scrolled      = ref(false)
  const tocBtnEl      = ref<HTMLElement | null>(null)
  const tocAsideEl    = ref<HTMLElement | null>(null)
  const tocPanelStyle = ref<Record<string, string>>({})

  function updateTocPanelStyle() {
    if (!tocBtnEl.value) return
    const r = tocBtnEl.value.getBoundingClientRect()
    const gap = scrolled.value ? 32 : 14
    tocPanelStyle.value = {
      right: `${document.documentElement.clientWidth - r.right}px`,
      top:   `${r.bottom + gap}px`,
    }
  }

  watch(tocOpen,  (open) => { if (open) nextTick().then(updateTocPanelStyle) })
  watch(scrolled, ()     => { if (tocOpen.value) updateTocPanelStyle() })

  const router = useRouter()
  function jumpTo(id: string, closePanel?: boolean) {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - Math.round(window.innerHeight / 3)
      window.scrollTo({ top, behavior: 'smooth' })
    }
    router.replace({ hash: `#${id}` })
    if (closePanel) tocOpen.value = false
  }

  function updateActiveId() {
    if (toc.value.length < 2) return
    const readLine = window.innerHeight * 0.5
    const headings = [...document.querySelectorAll<HTMLElement>('.post-body h2[id], .post-body h3[id]')]
    const metaEls  = [...document.querySelectorAll<HTMLElement>('#post-references, #post-comments')]
    const above = [...headings, ...metaEls].filter(el => el.getBoundingClientRect().top < readLine)
    if (above.length === 0) {
      if (toc.value[0]?.level === 'intro') activeId.value = 'post-body-start'
      return
    }
    activeId.value = above.at(-1)!.id
  }

  /* Fixed TOC follows the viewport center; near the article's end it would sail
     past the content, so the scroll handler pushes it up by exactly the amount
     its bottom overshoots the comments block's bottom. */
  function clampToc() {
    const el = tocAsideEl.value
    if (!el) return
    if (!window.matchMedia('(min-width: 72rem)').matches) {
      el.style.transform = ''
      return
    }
    const comments = document.getElementById('post-comments')
    if (!comments) return
    const desiredBottom = window.innerHeight / 2 + el.offsetHeight / 2
    const overshoot = Math.max(0, desiredBottom - comments.getBoundingClientRect().bottom)
    el.style.transform = overshoot > 0 ? `translateY(calc(-50% - ${Math.round(overshoot)}px))` : ''
  }

  onMounted(async () => {
    const onScroll = () => {
      scrolled.value = window.scrollY > 24
      updateActiveId()
      clampToc()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', clampToc, { passive: true })

    // Register cleanup + watcher synchronously (before the await) so they bind to
    // the active component instance — after `await nextTick()` there is none.
    onUnmounted(() => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', clampToc)
    })
    watch(opts.content, async () => { await nextTick(); updateActiveId(); clampToc() })

    await nextTick()
    updateActiveId()
    clampToc()
  })

  return { toc, activeId, tocOpen, tocBtnEl, tocAsideEl, tocPanelStyle, jumpTo }
}
