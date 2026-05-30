import { create } from 'zustand'
import {
  getBookings,
  getRooms,
  createBooking,
  updateBookingStatus,
} from '@/lib/bookings/bookings.functions'

import type { BookingWithRoom } from '@/lib/bookings/types'
import type { InferSelectModel } from 'drizzle-orm'
import type { rooms } from '@/db/schema'

type Room = InferSelectModel<typeof rooms>

export type StoreBooking = BookingWithRoom & {
  roomSnapshot: {
    roomNumber: string
    type: string
    basePrice: string
  }
}

type StoreState = {
  bookings: StoreBooking[]
  rooms: Room[]
  loading: boolean
  initialized: boolean

  init: () => Promise<void>
  addBooking: (data: {
    roomId: number
    firstName: string
    lastName: string
    contactNumber?: string
    checkInDate: string
    checkOutDate: string
    occupantsCount: number
  }) => Promise<void>
  updateBooking: (id: number, data: Partial<{ status: string; paymentStatus: string }>) => Promise<void>
  refresh: () => Promise<void>
  refreshRooms: () => Promise<void>
}

function withRoomSnapshot(booking: BookingWithRoom, room: Room | undefined): StoreBooking {
  return {
    ...booking,
    roomSnapshot: {
      roomNumber: room?.roomNumber ?? '—',
      type: room?.type ?? '—',
      basePrice: room?.basePrice ?? '0',
    },
  }
}

export const useStore = create<StoreState>((set, get) => ({
  bookings: [],
  rooms: [],
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    const [bookingRows, roomRows] = await Promise.all([
      getBookings(),
      getRooms(),
    ])
    const roomMap = new Map(roomRows.map((r) => [r.id, r]))
    const bookings = bookingRows.map((b) => withRoomSnapshot(b, roomMap.get(b.roomId)))
    set({ bookings, rooms: roomRows, loading: false, initialized: true })
  },

  addBooking: async (data) => {
    await createBooking({
      data: { ...data, depositPercentage: 20 },
    })
    const [bookingRows, roomRows] = await Promise.all([
      getBookings(),
      getRooms(),
    ])
    const roomMap = new Map(roomRows.map((r) => [r.id, r]))
    const bookings = bookingRows.map((b) => withRoomSnapshot(b, roomMap.get(b.roomId)))
    set({ bookings, rooms: roomRows })
  },

  updateBooking: async (id, data) => {
    const booking = get().bookings.find((b) => b.id === id)
    if (!booking) return
    if (data.status) {
      await updateBookingStatus({
        data: {
          bookingRef: booking.bookingRef,
          status: data.status as any,
          cancellationReason: data.status === 'CANCELLED' ? 'Cancelled by staff' : undefined,
        },
      })
    }
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...data } : b,
      ),
    }))
  },

  refresh: async () => {
    set({ loading: true })
    const [bookingRows, roomRows] = await Promise.all([
      getBookings(),
      getRooms(),
    ])
    const roomMap = new Map(roomRows.map((r) => [r.id, r]))
    const bookings = bookingRows.map((b) => withRoomSnapshot(b, roomMap.get(b.roomId)))
    set({ bookings, rooms: roomRows, loading: false })
  },

  refreshRooms: async () => {
    const roomRows = await getRooms()
    set({ rooms: roomRows })
  },
}))
