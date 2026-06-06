import type { rooms } from '@/db/schema'
import type { BookingWithRoom } from '@/lib/bookings/types'

type Room = typeof rooms.$inferSelect

type RoomOption = {
  value: string
  label: string
  disabled: boolean
}

function buildBookedDaysByRoom(bookings: BookingWithRoom[]) {
  const bookedDaysByRoom = new Map<number, Set<number>>()
  for (const booking of bookings) {
    if (booking.status !== 'RESERVED' && booking.status !== 'CHECKED_IN') {
      continue
    }
    const bStart = new Date(booking.checkInDate)
    bStart.setHours(0, 0, 0, 0)
    const bEnd = new Date(booking.checkOutDate)
    bEnd.setHours(0, 0, 0, 0)
    let set = bookedDaysByRoom.get(booking.roomId)
    if (!set) {
      set = new Set<number>()
      bookedDaysByRoom.set(booking.roomId, set)
    }
    if (bStart.getTime() === bEnd.getTime()) {
      set.add(bStart.getTime())
    } else {
      for (let t = bStart.getTime(); t < bEnd.getTime(); t += 86_400_000) {
        set.add(t)
      }
    }
  }
  return bookedDaysByRoom
}

export function useCreateBookingAvailability({
  rooms,
  bookings,
  checkInDate,
  checkOutDate,
}: {
  rooms: Room[]
  bookings: BookingWithRoom[]
  checkInDate: string
  checkOutDate: string
}) {
  const bookedDaysByRoom = buildBookedDaysByRoom(bookings)

  const conflictedRoomIds = new Set<number>()
  if (checkInDate && checkOutDate) {
    const start = new Date(checkInDate).getTime()
    const end = new Date(checkOutDate).getTime()
    if (end >= start) {
      for (const booking of bookings) {
        if (booking.status !== 'RESERVED' && booking.status !== 'CHECKED_IN') {
          continue
        }
        const bStart = new Date(booking.checkInDate).getTime()
        const bEnd = new Date(booking.checkOutDate).getTime()
        if (bStart <= end && bEnd >= start) {
          conflictedRoomIds.add(booking.roomId)
        }
      }
    }
  }

  const fullyBookedDays = new Set<number>()
  for (const set of bookedDaysByRoom.values()) {
    for (const day of set) {
      const allUnavailable = rooms.every(
        (r) =>
          r.status !== 'AVAILABLE' ||
          (bookedDaysByRoom.get(r.id)?.has(day) ?? false),
      )
      if (allUnavailable) fullyBookedDays.add(day)
    }
  }

  const isDateFullyBooked = (date: Date) => {
    const t = new Date(date)
    t.setHours(0, 0, 0, 0)
    return fullyBookedDays.has(t.getTime())
  }

  const allRooms = rooms.slice().sort((a, b) => {
    const aBlocked =
      a.status !== 'AVAILABLE' || conflictedRoomIds.has(a.id)
    const bBlocked =
      b.status !== 'AVAILABLE' || conflictedRoomIds.has(b.id)
    if (!aBlocked && bBlocked) return -1
    if (aBlocked && !bBlocked) return 1
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  const roomOptions: RoomOption[] = allRooms.map((room) => {
    const isConflicted = conflictedRoomIds.has(room.id)
    const statusTag =
      isConflicted && room.status === 'AVAILABLE'
        ? '[OCCUPIED]'
        : room.status !== 'AVAILABLE'
          ? `[${room.status}]`
          : ''

    return {
      value: room.id.toString(),
      label: `${room.roomNumber} - ${room.type} (₱${room.basePrice})${
        statusTag ? ` ${statusTag}` : ''
      }`,
      disabled: ['MAINTENANCE', 'OUT_OF_ORDER'].includes(room.status),
    }
  })

  return { roomOptions, isDateFullyBooked }
}
