import type { SiteSettings } from '../../server/api/settings.get'

/**
 * CV asset URL for the active locale, falling back to the other language when
 * only one file is uploaded.
 *
 * @remarks
 * Shares the `site-settings` fetch key with every other consumer, so the
 * settings singleton is requested once per render.
 */
export async function useCvUrl() {
  const { locale } = useI18n()
  const { data: settings } = await useFetch<SiteSettings>('/api/settings', { key: 'site-settings' })

  return computed(() => {
    const s = settings.value
    if (!s) return undefined
    return locale.value === 'ru'
      ? (s.cvUrlRu ?? s.cvUrlEn ?? undefined)
      : (s.cvUrlEn ?? s.cvUrlRu ?? undefined)
  })
}
