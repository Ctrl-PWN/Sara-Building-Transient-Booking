import type { BookingWithRoom } from './types'

type Room = {
  id: number
  roomNumber: string
  type: string
  capacity: number
  basePrice: string
  status: string
  createdAt: string | null
  deletedAt: string | null
}

export async function fetchBookings(): Promise<BookingWithRoom[]> {
  const res = await fetch('/api/bookings')
  if (!res.ok) throw new Error('Failed to fetch bookings')
  return res.json()
}

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch('/api/rooms')
  if (!res.ok) throw new Error('Failed to fetch rooms')
  return res.json()
}

export async function createBooking(data: {
  firstName: string
  lastName: string
  roomId: number
  contactNumber?: string
  checkInDate: string
  checkOutDate: string
  occupantsCount: number
  depositPercentage: number
}): Promise<{ success: boolean; bookingRef: string }> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create booking')
  return res.json()
}

export async function updateBookingStatus(data: {
  bookingRef: string
  status: string
  cancellationReason?: string
}): Promise<{ success: boolean }> {
  const res = await fetch('/api/bookings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update booking status')
  return res.json()
}
