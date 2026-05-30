import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { bookings, rooms } from '@/db/schema'

import { bookingByIdSchema, bookingStatusSchema } from './schemas'
import type { BookingWithRoom } from './types'

function mapBookingRow(row: {
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
  status: string
  paymentStatus: string
}): BookingWithRoom {
  return {
    id: row.id,
    bookingRef: row.bookingRef,
    guestName: row.guestName,
    contactNumber: row.contactNumber,
    roomId: row.roomId,
    roomNumber: row.roomNumber,
    roomType: row.roomType,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    occupantsCount: row.occupantsCount,
    status: bookingStatusSchema.parse(row.status),
    paymentStatus: row.paymentStatus,
  }
}

const bookingSelect = {
  id: bookings.id,
  bookingRef: bookings.bookingRef,
  guestName: bookings.guestName,
  contactNumber: bookings.contactNumber,
  roomId: bookings.roomId,
  roomNumber: rooms.roomNumber,
  roomType: rooms.type,
  checkInDate: bookings.checkInDate,
  checkOutDate: bookings.checkOutDate,
  occupantsCount: bookings.occupantsCount,
  status: bookings.status,
  paymentStatus: bookings.paymentStatus,
}

async function getBookingByIdFromDb(
  id: number,
): Promise<BookingWithRoom | null> {
  const rows = await db
    .select(bookingSelect)
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(and(eq(bookings.id, id), isNull(bookings.deletedAt)))
    .limit(1)

  const row = rows.at(0)
  if (row === undefined) {
    return null
  }

  return mapBookingRow(row)
}

async function getBookingsFromDb(): Promise<BookingWithRoom[]> {
  const rows = await db
    .select(bookingSelect)
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(isNull(bookings.deletedAt))
    .orderBy(asc(bookings.checkInDate))

  return rows.map(mapBookingRow)
}

export const getBookingById = createServerFn({ method: 'GET' })
  .inputValidator(bookingByIdSchema)
  .handler(async ({ data }) => {
    const booking = await getBookingByIdFromDb(data.id)
    if (!booking) {
      throw new Error('Booking not found')
    }
    return booking
  })

export const getBookings = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getBookingsFromDb()
  },
)
