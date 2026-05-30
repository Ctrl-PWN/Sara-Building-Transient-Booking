import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export type { BookingWithRoom } from './types'

async function loadDb() {
  const [{ db }, { bookings, rooms }, drizzle] = await Promise.all([
    import('@/db/index'),
    import('@/db/schema'),
    import('drizzle-orm'),
  ])

  const { eq, desc, and, isNull, sql, getTableColumns } = drizzle
  return { db, bookings, rooms, eq, desc, and, isNull, sql, getTableColumns }
}

function generateBookingRef(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BKG-${ts}${rand}`
}

export const getBookings = createServerFn({ method: 'GET' }).handler(async () => {
  const { db, bookings, rooms, eq, desc, isNull, getTableColumns } = await loadDb()
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
})

const bookingRefSchema = z.object({
  bookingRef: z.string().min(1, 'Booking reference is required'),
})

export const getBookingByRef = createServerFn({ method: 'GET' })
  .inputValidator(bookingRefSchema)
  .handler(async ({ data }) => {
    const { db, bookings, rooms, eq, and, isNull, getTableColumns } = await loadDb()
    const rows = await db
      .select({
        ...getTableColumns(bookings),
        roomNumber: rooms.roomNumber,
      })
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(and(eq(bookings.bookingRef, data.bookingRef), isNull(bookings.deletedAt)))
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
})

export const createBooking = createServerFn({ method: 'POST' })
  .inputValidator(createBookingSchema)
  .handler(async ({ data }) => {
    const { db, bookings } = await loadDb()
    const checkIn = new Date(data.checkInDate)
    const checkOut = new Date(data.checkOutDate)
    const depositHours = 24
    const depositDeadline = new Date(checkIn.getTime() - depositHours * 60 * 60 * 1000)
    const finalDueDate = new Date(checkOut.getTime() + 7 * 24 * 60 * 60 * 1000)

    const bookingRef = generateBookingRef()

    await db.insert(bookings).values({
      bookingRef,
      roomId: data.roomId,
      firstName: data.firstName,
      lastName: data.lastName,
      contactNumber: data.contactNumber,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      occupantsCount: data.occupantsCount,
      status: 'RESERVED',
      paymentStatus: 'CURRENT',
      depositDeadline,
      finalDueDate,
      depositPctSnapshot: data.depositPercentage.toString(),
    })

    return { success: true, bookingRef }
  })

export type BookingStatus = 'RESERVED' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'

const updateStatusSchema = z.object({
  bookingRef: z.string().min(1),
  status: z.enum(['RESERVED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']),
  cancellationReason: z.string().optional(),
})

export const updateBookingStatus = createServerFn({ method: 'POST' })
  .inputValidator(updateStatusSchema)
  .handler(async ({ data }) => {
    const { db, bookings, eq, sql } = await loadDb()
    const updateData: Record<string, unknown> = {
      status: data.status,
    }

    if (data.status === 'CANCELLED') {
      updateData.cancelledAt = sql`now()`
      updateData.cancellationReason = data.cancellationReason ?? null
    }

    await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.bookingRef, data.bookingRef))

    return { success: true }
  })

export const getRooms = createServerFn({ method: 'GET' }).handler(async () => {
  const { db, rooms, isNull } = await loadDb()
  return await db.query.rooms.findMany({
    where: isNull(rooms.deletedAt),
    orderBy: [rooms.roomNumber],
  })
})
