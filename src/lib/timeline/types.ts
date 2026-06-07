import type { BookingWithRoom } from '@/lib/bookings/types'

export type TimelineRoom = {
  id: number
  roomNumber: string
  type: string
}

export type TimelineWeekData = {
  weekStart: string
  weekEnd: string
  days: string[]
  rooms: TimelineRoom[]
  bookings: BookingWithRoom[]
}

export type TimelineBarPosition = {
  leftPct: number
  widthPct: number
}
