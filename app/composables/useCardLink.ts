/**
 * Makes a whole card clickable without covering it with a stretched link.
 *
 * @remarks
 * An overlay link hijacks the pointer: pressing on it starts a link drag rather
 * than a text selection, so the card's text can't be selected or copied. Here
 * the real link sits on the heading — that's what the keyboard and screen
 * readers follow — and the card only forwards a plain click.
 */
export function useCardLink(to: () => string) {
  const localePath = useLocalePath()

  return (event: MouseEvent) => {
    // a click that ends a selection is not a click on the card
    if (window.getSelection()?.toString()) return
    // the heading link handles itself, including modifier clicks
    if ((event.target as HTMLElement).closest('a')) return

    navigateTo(localePath(to()))
  }
}
