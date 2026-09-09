/** Canonical event names — the contract between client tracking and the
 *  relevance-scoring job (roadmap part 2) that reads them back from Umami.
 *  Change a value here and both sides move together. */
export const EV = {
  langSwitch:     'lang-switch',
  sectionView:    'section-view',
  scrollDepth:    'scroll-depth',
  ctaClick:       'cta-click',
  copyEmail:      'copy-email',
  workOpen:       'work-open',       // card / project opened
  workDepth:      'work-depth',      // scrolled into a case study
  workCompleted:  'work-completed',  // reached the end of a case study
  workLink:       'work-link',       // clicked the live project URL
  postRead:       'post-read',       // opened an article
  postCompleted:  'post-completed',  // reached the end of an article
  referenceClick: 'reference-click',
  commentStart:   'comment-start',
  contactStart:   'contact-start',
  outboundClick:  'outbound-click',
} as const

export type AnalyticsEvent = typeof EV[keyof typeof EV]

/** Local, narrow shape for `window.umami` — deliberately not a global
 *  `Window` augmentation: `@nuxt/scripts` (a transitive dependency, unused
 *  here) ships its own conflicting one, and TypeScript merges every
 *  `declare global` in the compilation regardless of whether the owning
 *  module is actually imported. */
type UmamiWindow = Window & { umami?: { track: (event: string, data?: Record<string, unknown>) => void } }

/** Thin, SSR-safe wrapper over umami.track. No-op when Umami hasn't loaded
 *  (dev, ad-blockers, env-gated off) so call sites never need to guard. */
export function useTrack() {
  return (event: AnalyticsEvent, data?: Record<string, unknown>) => {
    if (import.meta.client) (window as UmamiWindow).umami?.track(event, data)
  }
}
