import { createFileRoute } from '@tanstack/react-router'

async function loadDb() {
  const [{ db }, { rooms }, drizzle] = await Promise.all([
    import('@/db/index'),
    import('@/db/schema'),
    import('drizzle-orm'),
  ])

  const { isNull } = drizzle
  return { db, rooms, isNull }
}

export const Route = createFileRoute('/api/rooms')({
  server: {
    handlers: {
      GET: async () => {
        const { db, rooms, isNull } = await loadDb()
        const rows = await db.query.rooms.findMany({
          where: isNull(rooms.deletedAt),
          orderBy: [rooms.roomNumber],
        })

        return new Response(JSON.stringify(rows), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
