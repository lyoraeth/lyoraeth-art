export function useLoc() {
  const { locale } = useI18n()
  return (obj: { en: string; ru?: string | null } | null | undefined): string =>
    obj ? (locale.value === 'ru' && obj.ru ? obj.ru : obj.en) : ''
}
