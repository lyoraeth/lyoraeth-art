import { extractHeadings } from '#shared/markdown'

export interface TocEntry { id: string; text: string; level: 2 | 3 | 'intro' }

/** Table of contents for a markdown article: builds the entry list from the
 *  raw source and tracks which heading is active while scrolling.
 *
 *  `content` is the rendered HTML — watched so the active id re-measures once
 *  the new body has hit the DOM (e.g. after a locale switch). Positioning the
 *  sidebar is CSS's job now (`position: sticky` inside its own grid column),
 *  not this composable's — the fixed/clamp dance it used to do only existed
 *  because the dark shell's `overflow-x: hidden` broke sticky outright. */
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

    // same extraction the docs index uses: inline markup stripped from the
    // label, the id still taken from the raw heading (what the renderer
    // stamps), and a "## comment" inside a code fence is not a heading
    entries.push(...extractHeadings(raw))
    return entries
  })

  const activeId = ref('')

  const router = useRouter()
  function jumpTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - Math.round(window.innerHeight / 3)
      window.scrollTo({ top, behavior: 'smooth' })
    }
    router.replace({ hash: `#${id}` })
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

  onMounted(async () => {
    // Batched to one measurement per frame — a bare scroll listener would
    // otherwise re-query the DOM on every event, of which a fast scroll
    // fires far more than the display can paint.
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        updateActiveId()
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Registered synchronously (before the await) so it binds to the active
    // component instance — after `await nextTick()` there is none.
    onUnmounted(() => window.removeEventListener('scroll', onScroll))
    watch(opts.content, async () => {
      await nextTick()
      updateActiveId()
    })

    await nextTick()
    updateActiveId()
  })

  return { toc, activeId, jumpTo }
}
