import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/index'
import { bookings, ledgerTransactions, rooms } from '@/db/schema'
import {
  computeRemainingBalance,
  normalizeReferenceNumber,
  RESERVATION_BALANCE_DESCRIPTION,
  syncBookingPaymentStatus,
} from '@/lib/ledger/ledger.helpers'
import { buildCreateBookingLedgerLines } from './create-booking-ledger'

import {
  bookingByIdSchema,
  bookingStatusSchema,
  checkInBookingSchema,
  checkOutBookingSchema,
  createBookingServerSchema,
  updateStatusSchema,
} from './schemas'
import { calculateStayPricing } from './stay-pricing'
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
    .where(
      and(
        isNull(bookings.deletedAt),
        or(eq(bookings.status, 'RESERVED'), eq(bookings.status, 'CHECKED_IN')),
      ),
    )
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

export const createBooking = createServerFn({ method: 'POST' })
  .inputValidator(createBookingServerSchema)
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
            lte(bookings.checkInDate, data.checkOutDate),
            gte(bookings.checkOutDate, data.checkInDate),
          ),
        ),
      )
      .limit(1)

    if (conflicts.length > 0) {
      throw new Error('Room is already booked for the selected dates')
    }

    const roomRows = await db
      .select({ capacity: rooms.capacity, basePrice: rooms.basePrice })
      .from(rooms)
      .where(eq(rooms.id, data.roomId))
      .limit(1)

    if (roomRows.length === 0) {
      throw new Error('Room not found')
    }

    const room = roomRows[0]

    if (data.occupantsCount > room.capacity) {
      throw new Error(`Room capacity exceeded (max ${room.capacity} occupants)`)
    }

    const { subtotal: stayTotal } = calculateStayPricing({
      basePrice: room.basePrice,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
    })

    const ledgerLines = buildCreateBookingLedgerLines(
      {
        walkIn: data.walkIn,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
        reservationFeeType: data.reservationFeeType,
        reservationFeeValue: data.reservationFeeValue,
      },
      stayTotal,
    )

    const checkIn = new Date(data.checkInDate)
    const checkOut = new Date(data.checkOutDate)
    const depositHours = 24
    const depositDeadline = new Date(
      checkIn.getTime() - depositHours * 60 * 60 * 1000,
    )
    const finalDueDate = new Date(checkOut.getTime() + 7 * 24 * 60 * 60 * 1000)

    const bookingRef = generateBookingRef()
    const status = data.walkIn ? 'CHECKED_IN' : 'RESERVED'
    const paymentStatus = data.walkIn ? 'PAID_IN_FULL' : 'CURRENT'

    const { bookingId } = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(bookings)
        .values({
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
          depositPctSnapshot: data.depositPercentage.toFixed(2),
        })
        .returning()

      await tx.insert(ledgerTransactions).values(
        ledgerLines.map((line) => ({
          bookingId: row.id,
          category: line.category,
          amount: line.amount,
          isPaid: line.isPaid,
          description: line.description ?? null,
          paymentMethod: line.isPaid ? (line.paymentMethod ?? null) : null,
          referenceNumber: line.isPaid
            ? line.referenceNumber?.trim() || null
            : null,
        })),
      )

      if (data.walkIn) {
        await tx
          .update(rooms)
          .set({ status: 'OCCUPIED' })
          .where(eq(rooms.id, data.roomId))
      }

      return { bookingId: row.id }
    })

    return { success: true, bookingRef, bookingId }
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
    } else if (['CANCELLED', 'CHECKED_OUT', 'EVICTED'].includes(data.status)) {
      await db
        .update(rooms)
        .set({ status: 'AVAILABLE' })
        .where(eq(rooms.id, roomId))
    }

    return { success: true }
  })

export const checkInBooking = createServerFn({ method: 'POST' })
  .inputValidator(checkInBookingSchema)
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        roomId: bookings.roomId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingRef, data.bookingRef),
          isNull(bookings.deletedAt),
        ),
      )
      .limit(1)

    if (!rows[0]) {
      throw new Error('Booking not found')
    }

    const booking = rows[0]

    if (booking.status !== 'RESERVED') {
      throw new Error('Only reserved bookings can be checked in')
    }

    const unpaidRoomCharges = await db
      .select()
      .from(ledgerTransactions)
      .where(
        and(
          eq(ledgerTransactions.bookingId, booking.id),
          eq(ledgerTransactions.category, 'ROOM_CHARGE'),
          eq(ledgerTransactions.isPaid, false),
        ),
      )

    if (unpaidRoomCharges.length !== 1) {
      throw new Error('Expected exactly one unpaid room balance to settle')
    }

    const roomBalance = unpaidRoomCharges[0]
    if (roomBalance.description !== RESERVATION_BALANCE_DESCRIPTION) {
      throw new Error('Unpaid room balance does not match reservation ledger')
    }

    const referenceNumber = normalizeReferenceNumber(
      data.paymentMethod,
      data.referenceNumber,
    )

    await db.transaction(async (tx) => {
      await tx
        .update(ledgerTransactions)
        .set({
          isPaid: true,
          paymentMethod: data.paymentMethod,
          referenceNumber,
        })
        .where(eq(ledgerTransactions.id, roomBalance.id))

      await tx
        .update(bookings)
        .set({ status: 'CHECKED_IN' })
        .where(eq(bookings.id, booking.id))

      await syncBookingPaymentStatus(booking.id, tx)

      await tx
        .update(rooms)
        .set({ status: 'OCCUPIED' })
        .where(eq(rooms.id, booking.roomId))
    })

    return { success: true }
  })

export const checkOutBooking = createServerFn({ method: 'POST' })
  .inputValidator(checkOutBookingSchema)
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        id: bookings.id,
        status: bookings.status,
        roomId: bookings.roomId,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingRef, data.bookingRef),
          isNull(bookings.deletedAt),
        ),
      )
      .limit(1)

    if (!rows[0]) {
      throw new Error('Booking not found')
    }

    const booking = rows[0]

    if (booking.status !== 'CHECKED_IN') {
      throw new Error('Only checked-in bookings can be checked out')
    }

    const remainingBalance = await computeRemainingBalance(booking.id, db)
    if (remainingBalance > 0) {
      throw new Error(
        'Cannot check out while there is an outstanding balance. Settle all charges first.',
      )
    }

    await db.transaction(async (tx) => {
      await tx
        .update(bookings)
        .set({ status: 'CHECKED_OUT' })
        .where(eq(bookings.id, booking.id))

      await tx
        .update(rooms)
        .set({ status: 'AVAILABLE' })
        .where(eq(rooms.id, booking.roomId))
    })

    return { success: true }
  })
