import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db/index'
import {
  eq,
  and,
  desc,
  isNull,
} from 'drizzle-orm'
import { bookings, rooms } from '@/db/schema'

import { bookingByIdSchema, bookingStatusSchema } from './schemas'
import type { BookingPaymentStatus, BookingWithRoom } from './types'

function mapBookingRow(row: {
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
  occupantsCount: number
  status: string
  paymentStatus: string
  depositDeadline: Date | string | null
  finalDueDate: Date | string | null
  depositPctSnapshot: string | null
  cancellationReason: string | null
  cancelledAt: Date | string | null
  createdAt: Date | string | null
  deletedAt: Date | string | null
}): BookingWithRoom {
  return {
    id: row.id,
    bookingRef: row.bookingRef,
    firstName: row.firstName,
    lastName: row.lastName,
    contactNumber: row.contactNumber,
    roomId: row.roomId,
    roomNumber: row.roomNumber,
    roomType: row.roomType,
    roomBasePrice: row.roomBasePrice,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    occupantsCount: row.occupantsCount,
    status: bookingStatusSchema.parse(row.status),
    paymentStatus: row.paymentStatus as BookingPaymentStatus,
    depositDeadline: row.depositDeadline,
    finalDueDate: row.finalDueDate,
    depositPctSnapshot: row.depositPctSnapshot ?? '',
    cancellationReason: row.cancellationReason,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  }
}

const bookingSelect = {
  id: bookings.id,
  bookingRef: bookings.bookingRef,
  firstName: bookings.firstName,
  lastName: bookings.lastName,
  contactNumber: bookings.contactNumber,
  roomId: bookings.roomId,
  roomNumber: rooms.roomNumber,
  roomType: rooms.type,
  roomBasePrice: rooms.basePrice,
  checkInDate: bookings.checkInDate,
  checkOutDate: bookings.checkOutDate,
  occupantsCount: bookings.occupantsCount,
  status: bookings.status,
  paymentStatus: bookings.paymentStatus,
  depositDeadline: bookings.depositDeadline,
  finalDueDate: bookings.finalDueDate,
  depositPctSnapshot: bookings.depositPctSnapshot,
  cancellationReason: bookings.cancellationReason,
  cancelledAt: bookings.cancelledAt,
  createdAt: bookings.createdAt,
  deletedAt: bookings.deletedAt,
}

export function generateBookingRef(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `BK-${y}${m}${d}-${seq}`
}

async function getBookingsFromDb(): Promise<BookingWithRoom[]> {
  const rows = await db
    .select(bookingSelect)
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(isNull(bookings.deletedAt))
    .orderBy(desc(bookings.createdAt))

  return rows.map(mapBookingRow)
}

export const getBookings = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getBookingsFromDb()
  },
)

export const getBookingById = createServerFn({ method: 'GET' })
  .inputValidator(bookingByIdSchema)
  .handler(async ({ data }) => {
    const rows = await db
      .select(bookingSelect)
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(and(eq(bookings.id, data.id), isNull(bookings.deletedAt)))
      .limit(1)

    if (!rows[0]) {
      throw new Error('Booking not found')
    }

    return mapBookingRow(rows[0])
  })

export const getRooms = createServerFn({ method: 'GET' }).handler(async () => {
  return await db.query.rooms.findMany({
    where: isNull(rooms.deletedAt),
    orderBy: [rooms.roomNumber],
  })
})

const bookingRefSchema = z.object({
  bookingRef: z.string().min(1, 'Booking reference is required'),
})

export const getBookingByRef = createServerFn({ method: 'GET' })
  .inputValidator(bookingRefSchema)
  .handler(async ({ data }) => {
    const rows = await db
      .select(bookingSelect)
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(
        and(
          eq(bookings.bookingRef, data.bookingRef),
          isNull(bookings.deletedAt),
        ),
      )
      .limit(1)

    return rows[0] ? mapBookingRow(rows[0]) : null
  })
