import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db/index'
import {
  eq,
  and,
  or,
  gt,
  lt,
  desc,
  isNull,
  sql,
  getTableColumns,
} from 'drizzle-orm'
import { bookings, rooms } from '@/db/schema'

import type { InferSelectModel } from 'drizzle-orm'

type Booking = InferSelectModel<typeof bookings>

export type BookingWithRoom = Booking & {
  roomNumber: string | null
}

function generateBookingRef(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `BK-${y}${m}${d}-${seq}`
}

export const getBookings = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db
      .select({
        ...getTableColumns(bookings),
        roomNumber: rooms.roomNumber,
      })
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(isNull(bookings.deletedAt))
      .orderBy(desc(bookings.createdAt))

    return rows
  },
)

const bookingByIdSchema = z.object({
  id: z.number().int().positive(),
})

export const getBookingById = createServerFn({ method: 'GET' })
  .inputValidator(bookingByIdSchema)
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        ...getTableColumns(bookings),
        roomNumber: rooms.roomNumber,
      })
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(
        and(eq(bookings.id, data.id), isNull(bookings.deletedAt)),
      )
      .limit(1)

    return rows[0] ?? null
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
      .select({
        ...getTableColumns(bookings),
        roomNumber: rooms.roomNumber,
      })
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(
        and(
          eq(bookings.bookingRef, data.bookingRef),
          isNull(bookings.deletedAt),
        ),
      )
      .limit(1)

    return rows[0] ?? null
  })

const createBookingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roomId: z.number().int().positive('Room is required'),
  contactNumber: z.string().optional(),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  occupantsCount: z.number().int().positive('At least 1 occupant required'),
  depositPercentage: z.number().min(0).max(100),
  isNonRefundable: z.boolean().optional(),
  walkIn: z.boolean().optional(),
}).refine(
  (data) => new Date(data.checkOutDate) > new Date(data.checkInDate),
  { message: 'Check-out date must be after check-in date', path: ['checkOutDate'] },
)

export const createBooking = createServerFn({ method: 'POST' })
  .inputValidator(createBookingSchema)
  .handler(async ({ data }) => {
    const conflicts = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, data.roomId),
          isNull(bookings.deletedAt),
          or(
            eq(bookings.status, 'RESERVED'),
            eq(bookings.status, 'CHECKED_IN'),
          ),
          and(
            lt(bookings.checkInDate, data.checkOutDate),
            gt(bookings.checkOutDate, data.checkInDate),
          ),
        ),
      )
      .limit(1)

    if (conflicts.length > 0) {
      throw new Error('Room is already booked for the selected dates')
    }

    const roomRows = await db
      .select({ capacity: rooms.capacity })
      .from(rooms)
      .where(eq(rooms.id, data.roomId))
      .limit(1)

    if (roomRows.length === 0) {
      throw new Error('Room not found')
    }

    if (data.occupantsCount > roomRows[0].capacity) {
      throw new Error(
        `Room capacity exceeded (max ${roomRows[0].capacity} occupants)`,
      )
    }

    const checkIn = new Date(data.checkInDate)
    const checkOut = new Date(data.checkOutDate)
    const depositHours = 24
    const depositDeadline = new Date(
      checkIn.getTime() - depositHours * 60 * 60 * 1000,
    )
    const finalDueDate = new Date(
      checkOut.getTime() + 7 * 24 * 60 * 60 * 1000,
    )

    const bookingRef = generateBookingRef()

    let status = data.isNonRefundable ? 'CHECKED_IN' : 'RESERVED'
    let paymentStatus = data.isNonRefundable ? 'PAID_IN_FULL' : 'CURRENT'

    if (data.walkIn) {
      status = 'CHECKED_IN'
      paymentStatus = 'PAID_IN_FULL'
    }

    await db.insert(bookings).values({
      bookingRef,
      roomId: data.roomId,
      firstName: data.firstName,
      lastName: data.lastName,
      contactNumber: data.contactNumber,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      occupantsCount: data.occupantsCount,
      status,
      paymentStatus,
      depositDeadline,
      finalDueDate,
      depositPctSnapshot: data.depositPercentage.toString(),
    })

    if (status === 'CHECKED_IN') {
      await db
        .update(rooms)
        .set({ status: 'OCCUPIED' })
        .where(eq(rooms.id, data.roomId))
    }

    return { success: true, bookingRef }
  })

export type BookingStatus =
  | 'RESERVED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EVICTED'

const updateStatusSchema = z.object({
  bookingRef: z.string().min(1),
  status: z.enum([
    'RESERVED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED',
    'EVICTED',
  ]),
  cancellationReason: z.string().optional(),
  evictionReason: z.string().optional(),
})

export const updateBookingStatus = createServerFn({ method: 'POST' })
  .inputValidator(updateStatusSchema)
  .handler(async ({ data }) => {
    const rows = await db
      .select({ id: bookings.id, roomId: bookings.roomId })
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingRef, data.bookingRef),
          isNull(bookings.deletedAt),
        ),
      )
      .limit(1)

    if (rows.length === 0) {
      throw new Error('Booking not found')
    }

    const updateData: Record<string, unknown> = {
      status: data.status,
    }

    if (data.status === 'CANCELLED') {
      updateData.cancelledAt = sql`now()`
      updateData.cancellationReason = data.cancellationReason ?? null
    }

    if (data.status === 'EVICTED') {
      updateData.cancelledAt = sql`now()`
      updateData.cancellationReason = data.evictionReason ?? 'Evicted'
    }

    await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.bookingRef, data.bookingRef))

    const roomId = rows[0].roomId

    if (data.status === 'CHECKED_IN') {
      await db
        .update(rooms)
        .set({ status: 'OCCUPIED' })
        .where(eq(rooms.id, roomId))
    } else if (
      ['CANCELLED', 'CHECKED_OUT', 'EVICTED'].includes(data.status)
    ) {
      await db
        .update(rooms)
        .set({ status: 'AVAILABLE' })
        .where(eq(rooms.id, roomId))
    }

    return { success: true }
  })
