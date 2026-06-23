export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const storage = useStorage('ratings')
  return (await storage.getItem<{ up: number; down: number }>(slug)) ?? { up: 0, down: 0 }
})
