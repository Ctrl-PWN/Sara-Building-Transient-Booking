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
  depositDeadline: string
  finalDueDate: string | null
  depositPctSnapshot: string
  cancellationReason: string | null
  cancelledAt: string | null
  createdAt: string | null
  deletedAt: string | null
  roomNumber: string | null
}

export type BookingStatus = 'RESERVED' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
