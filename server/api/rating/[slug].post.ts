export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { dir } = await readBody<{ dir: 'up' | 'down' }>(event)
  if (dir !== 'up' && dir !== 'down') throw createError({ statusCode: 400 })

  const storage = useStorage('ratings')
  const current = (await storage.getItem<{ up: number; down: number }>(slug)) ?? { up: 0, down: 0 }
  current[dir]++
  await storage.setItem(slug, current)
  return current
})
