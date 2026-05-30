export type BookingStatus =
  | 'RESERVED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EVICTED'

export type BookingWithRoom = {
  id: number
  bookingRef: string
  roomId: number
  firstName: string
  lastName: string
  contactNumber: string | null
  checkInDate: string
  checkOutDate: string
  occupantsCount: number
  status: string
  paymentStatus: string
  depositDeadline: string | Date | null
  finalDueDate: string | Date | null
  depositPctSnapshot: string
  cancellationReason: string | null
  cancelledAt: string | Date | null
  createdAt: string | Date | null
  deletedAt: string | Date | null
  roomNumber: string | null
}

export type TimelineLegendStatus = 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT'
