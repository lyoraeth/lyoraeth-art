import { setResponseHeader } from 'h3'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
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
