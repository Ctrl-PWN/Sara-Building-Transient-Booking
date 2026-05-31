import type { bookings } from '@/db/schema'
import type { BookingPaymentStatus, BookingStatus } from '@/db/schema/enums'

export type { BookingPaymentStatus, BookingStatus }

export type BookingWithRoom = {
  id: number
  bookingRef: string
  firstName: string
  lastName: string
  contactNumber: string | null
  roomId: number
  roomNumber: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  occupantsCount: number
  status: BookingStatus
  paymentStatus: BookingPaymentStatus
}

export type TimelineLegendStatus = 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT'

export type BookingRow = typeof bookings.$inferSelect

export function formatGuestName(booking: {
  firstName: string
  lastName: string
}): string {
  return `${booking.firstName} ${booking.lastName}`.trim()
}
