export type BookingStatus =
  | 'RESERVED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'

export type BookingWithRoom = {
  id: number
  bookingRef: string
  guestName: string
  contactNumber: string | null
  roomId: number
  roomNumber: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  occupantsCount: number
  status: BookingStatus
  paymentStatus: string
}

export type TimelineLegendStatus = 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT'
