import { setResponseHeader } from 'h3'

/** Nitro plugin: stamps each response with a `Server-Timing: app;dur=<ms>`
 *  header measuring handler wall-time from request start to beforeResponse. */
export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('request', event => {
    event.context._timingStart = performance.now()
  })

  nitroApp.hooks.hook('beforeResponse', (event, _response) => {
    if (event.context._timingStart !== undefined) {
      setResponseHeader(
        event,
        'Server-Timing',
        `app;dur=${Math.round(performance.now() - event.context._timingStart)}`,
      )
    }
  })
})
