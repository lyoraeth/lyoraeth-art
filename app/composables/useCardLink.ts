/**
 * Makes a whole card clickable without covering it with a stretched link.
 *
 * @remarks
 * An overlay link hijacks the pointer: pressing on it starts a link drag rather
 * than a text selection, so the card's text can't be selected or copied. Here
 * the real link sits on the heading — that's what the keyboard and screen
 * readers follow — and the card forwards the pointer gestures a link would
 * honour, while staying out of the way of the ones that mean something else.
 *
 * @returns handlers to spread onto the card with `v-on`
 */
export function useCardLink(to: () => string) {
  const localePath = useLocalePath()

  /** Where the press started — a release far from it was a drag, not a click. */
  let pressedAt: { x: number; y: number } | null = null
  const DRAG_THRESHOLD = 4

  /**
   * A double click on text selects a word, but its first click is
   * indistinguishable from a single one until the second arrives. Only clicks
   * that land on text wait it out; anywhere else on the card opens at once.
   */
  const DOUBLE_CLICK_WINDOW = 260
  let pending: ReturnType<typeof setTimeout> | null = null

  const cancelPending = () => {
    if (pending) clearTimeout(pending)
    pending = null
  }

  function open(event: MouseEvent) {
    const path = localePath(to())
    // the modifiers a link would open in a new tab for
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) {
      window.open(path, '_blank', 'noopener')
      return
    }
    navigateTo(path)
  }

  /** The heading link handles its own clicks, modifiers included. */
  const onLink = (event: MouseEvent) => Boolean((event.target as HTMLElement).closest('a'))

  return {
    pointerdown: (event: PointerEvent) => {
      pressedAt = { x: event.clientX, y: event.clientY }
    },

    click: (event: MouseEvent) => {
      if (event.detail > 1) {
        cancelPending()
        return
      }
      if (window.getSelection()?.toString()) return
      if (onLink(event)) return
      if (pressedAt && Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) > DRAG_THRESHOLD) return

      if ((event.target as HTMLElement).closest('p')) {
        cancelPending()
        pending = setTimeout(() => open(event), DOUBLE_CLICK_WINDOW)
        return
      }

      open(event)
    },

    // middle click never fires a click event
    auxclick: (event: MouseEvent) => {
      if (event.button !== 1 || onLink(event)) return
      event.preventDefault()
      open(event)
    },
  }
}
