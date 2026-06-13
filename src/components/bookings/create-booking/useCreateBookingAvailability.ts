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
  walkIn,
}: {
  rooms: Room[]
  bookings: BookingWithRoom[]
  walkIn: boolean
}) {
  const bookedDaysByRoom = buildBookedDaysByRoom(bookings)

  const activeBookingRoomIds = new Set<number>()
  for (const booking of bookings) {
    if (booking.status === 'RESERVED' || booking.status === 'CHECKED_IN') {
      activeBookingRoomIds.add(booking.roomId)
    }
  }

  const allRooms = rooms.slice().sort((a, b) => {
    const aBlocked = a.status !== 'AVAILABLE'
    const bBlocked = b.status !== 'AVAILABLE'
    if (!aBlocked && bBlocked) return -1
    if (aBlocked && !bBlocked) return 1
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  const roomOptions: RoomOption[] = allRooms.map((room) => {
    const hasActiveBooking = activeBookingRoomIds.has(room.id)
    const statusTag = hasActiveBooking
      ? ' [OCCUPIED]'
      : room.status !== 'AVAILABLE'
        ? ` [${room.status}]`
        : ''

    return {
      value: room.id.toString(),
      label: `${room.roomNumber} - ${room.type} (₱${room.basePrice})${statusTag}`,
      disabled:
        ['MAINTENANCE', 'OUT_OF_ORDER'].includes(room.status) ||
        (walkIn && hasActiveBooking),
    }
  })

  const getBookedDatesForRoom = (roomId: number): Set<number> => {
    return bookedDaysByRoom.get(roomId) ?? new Set()
  }

  return { roomOptions, getBookedDatesForRoom }
}
