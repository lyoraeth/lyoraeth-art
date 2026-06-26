export default defineEventHandler((event) => {
  const start = performance.now()
  onBeforeResponse(event, () => {
    setHeader(event, 'Server-Timing', `app;dur=${Math.round(performance.now() - start)}`)
  })
})
