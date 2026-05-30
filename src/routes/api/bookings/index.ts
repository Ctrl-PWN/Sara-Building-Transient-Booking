import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

async function loadDb() {
  const [{ db }, { bookings, rooms }, drizzle] = await Promise.all([
    import('@/db/index'),
    import('@/db/schema'),
    import('drizzle-orm'),
  ])

  const { eq, desc, isNull, sql, getTableColumns } = drizzle
  return { db, bookings, rooms, eq, desc, isNull, sql, getTableColumns }
}

function generateBookingRef(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BKG-${ts}${rand}`
}

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

const updateStatusSchema = z.object({
  bookingRef: z.string().min(1),
  status: z.enum(['RESERVED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']),
  cancellationReason: z.string().optional(),
})

export const Route = createFileRoute('/api/bookings/')({
  server: {
    handlers: {
      GET: async () => {
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

        return new Response(JSON.stringify(rows), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
      POST: async ({ request }) => {
        const { db, bookings } = await loadDb()
        const body = await request.json()
        const parsed = createBookingSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(JSON.stringify({ error: parsed.error.issues }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const { data } = parsed
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

        return new Response(JSON.stringify({ success: true, bookingRef }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
      PUT: async ({ request }) => {
        const { db, bookings, eq, sql } = await loadDb()
        const body = await request.json()
        const parsed = updateStatusSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(JSON.stringify({ error: parsed.error.issues }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const { data } = parsed
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

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
