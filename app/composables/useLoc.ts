/** Returns a reactive picker for `{ en, ru }` localized fields: yields the RU
 *  value on the RU locale when present, else falls back to EN; '' for nullish. */
export function useLoc() {
  const { locale } = useI18n()
  return (obj: { en: string; ru?: string | null } | null | undefined): string =>
    obj ? (locale.value === 'ru' && obj.ru ? obj.ru : obj.en) : ''
}
