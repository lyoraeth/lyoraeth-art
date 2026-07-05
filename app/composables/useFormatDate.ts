/** Returns a locale-aware date formatter (en-GB / ru-RU by active locale).
 *  Takes an ISO string; `'short'` → dd.mm.yyyy, `'long'` → spelled-out month. */
export function useFormatDate() {
  const { locale } = useI18n()
  const lang = computed(() => locale.value === 'ru' ? 'ru-RU' : 'en-GB')

  return (iso: string, style: 'short' | 'long' = 'short') => {
    const d = new Date(iso)
    if (style === 'long') {
      return d.toLocaleDateString(lang.value, { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return d.toLocaleDateString(lang.value, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
}
