import { create } from 'zustand'
import {
  getBookings,
  getRooms,
  createBooking,
  updateBookingStatus,
} from '@/lib/bookings/bookings.functions'

import type { BookingWithRoom } from '@/lib/bookings/types'

type Room = {
  id: number
  roomNumber: string
  type: string
  capacity: number
  basePrice: string
  status: string
  createdAt: Date | null
  deletedAt: Date | null
}

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
    depositPercentage?: number
    isNonRefundable?: boolean
    walkIn?: boolean
  }) => Promise<void>
  updateBooking: (
    id: number,
    data: Partial<{ status: string; paymentStatus: string; evictionReason: string }>,
  ) => Promise<void>
  cancelBooking: (id: number, reason: string) => Promise<void>
  refresh: () => Promise<void>
  refreshRooms: () => Promise<void>
}

function withRoomSnapshot(
  booking: BookingWithRoom,
  room: Room | undefined,
): StoreBooking {
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
    const bookings = bookingRows.map((b) =>
      withRoomSnapshot(b, roomMap.get(b.roomId)),
    )
    set({ bookings, rooms: roomRows, loading: false, initialized: true })
  },

  addBooking: async (data) => {
    await createBooking({
      data: {
        ...data,
        depositPercentage: data.isNonRefundable ? (data.depositPercentage ?? 100) : (data.depositPercentage ?? 20),
        isNonRefundable: data.isNonRefundable ?? false,
        walkIn: data.walkIn ?? false,
      },
    })
    const [bookingRows, roomRows] = await Promise.all([
      getBookings(),
      getRooms(),
    ])
    const roomMap = new Map(roomRows.map((r) => [r.id, r]))
    const bookings = bookingRows.map((b) =>
      withRoomSnapshot(b, roomMap.get(b.roomId)),
    )
    set({ bookings, rooms: roomRows })
  },

  cancelBooking: async (id: number, reason: string) => {
    const booking = get().bookings.find((b) => b.id === id)
    if (!booking) return
    await updateBookingStatus({
      data: {
        bookingRef: booking.bookingRef,
        status: 'CANCELLED',
        cancellationReason: reason,
      },
    })
    const [bookingRows, roomRows] = await Promise.all([
      getBookings(),
      getRooms(),
    ])
    const roomMap = new Map(roomRows.map((r) => [r.id, r]))
    const bookings = bookingRows.map((b) =>
      withRoomSnapshot(b, roomMap.get(b.roomId)),
    )
    set({ bookings, rooms: roomRows })
  },

  updateBooking: async (id, data) => {
    const booking = get().bookings.find((b) => b.id === id)
    if (!booking) return
    if (data.status) {
      await updateBookingStatus({
        data: {
          bookingRef: booking.bookingRef,
          status: data.status as 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'EVICTED',
          evictionReason: data.evictionReason,
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
    const bookings = bookingRows.map((b) =>
      withRoomSnapshot(b, roomMap.get(b.roomId)),
    )
    set({ bookings, rooms: roomRows, loading: false })
  },

  refreshRooms: async () => {
    const roomRows = await getRooms()
    set({ rooms: roomRows })
  },
}))
