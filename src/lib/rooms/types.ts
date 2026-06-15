import type { rooms } from '@/db/schema'

export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
