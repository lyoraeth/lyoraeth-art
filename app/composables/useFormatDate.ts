/** Returns a locale-aware date formatter (en-GB / ru-RU by active locale).
 *  Takes an ISO string; `'short'` → dd.mm.yyyy, `'medium'` → abbreviated month,
 *  `'long'` → spelled-out month. */
export function useFormatDate() {
  const { locale } = useI18n()
  const lang = computed(() => locale.value === 'ru' ? 'ru-RU' : 'en-GB')

  return (iso: string, style: 'short' | 'medium' | 'long' = 'short') => {
    const d = new Date(iso)
    if (style === 'long') {
      return d.toLocaleDateString(lang.value, { day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (style === 'medium') {
      // assembled from parts: ru-RU appends " г." to a formatted date, which the
      // design doesn't carry. Both locales order day-month-year.
      const parts = new Intl.DateTimeFormat(lang.value, { day: 'numeric', month: 'short', year: 'numeric' })
        .formatToParts(d)
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
      return `${part('day')} ${part('month')} ${part('year')}`
    }
    return d.toLocaleDateString(lang.value, { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
}
