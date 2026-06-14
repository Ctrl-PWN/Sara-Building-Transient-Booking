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
  roomBasePrice: string | null
  checkInDate: string
  checkOutDate: string
  checkInTime: string
  checkOutTime: string
  occupantsCount: number
  status: BookingStatus
  paymentStatus: BookingPaymentStatus
  depositDeadline: string | Date | null
  finalDueDate: string | Date | null
  depositPctSnapshot: string
  cancellationReason: string | null
  cancelledAt: string | Date | null
  createdAt: string | Date | null
  deletedAt: string | Date | null
}

export type TimelineLegendStatus = 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT'

export type BookingRow = typeof bookings.$inferSelect

export function formatGuestName(booking: {
  firstName: string
  lastName: string
}): string {
  return `${booking.firstName} ${booking.lastName}`.trim()
}
