import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db/index'
import { isNull} from 'drizzle-orm'
import { rooms } from '@/db/schema'

export const getRooms = createServerFn({ method: 'GET' }).handler(async () => {
  return await db.query.rooms.findMany({
    where: isNull(rooms.deletedAt),
    orderBy: [rooms.roomNumber],
  })
})

export const roomKeys = {
  all: ['rooms'] as const,
  lists: () => [...roomKeys.all, 'list'] as const,
}

export const roomQueries = {
  list: () =>
    queryOptions({
      queryKey: roomKeys.lists(),
      queryFn: () => getRooms(),
    }),
}
