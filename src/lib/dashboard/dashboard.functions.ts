import { createServerFn } from "@tanstack/react-start";
import { differenceInCalendarDays } from "date-fns";
import { and, count, eq, inArray, isNull, lt } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/index";
import { bookings, rooms } from "@/db/schema";
import { ledgerTransactions } from "@/db/schema/ledger-transactions";
import { parseManilaDate, todayIsoInManila } from "@/lib/date/manila";

import type { DashboardMetrics, OverdueFlagRow } from "./dashboard.types";

const getDashboardMetricsSchema = z.object({
  date: z.string().date().optional(),
});

const bookingSelect = {
  id: bookings.id,
  bookingRef: bookings.bookingRef,
  firstName: bookings.firstName,
  lastName: bookings.lastName,
  roomId: rooms.id,
  roomNumber: rooms.roomNumber,
  roomType: rooms.type,
  checkInDate: bookings.checkInDate,
  checkOutDate: bookings.checkOutDate,
  occupantsCount: bookings.occupantsCount,
};

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .inputValidator(getDashboardMetricsSchema)
  .handler(async ({ data }): Promise<DashboardMetrics> => {
    const today = data.date ?? todayIsoInManila();
    const todayDate = parseManilaDate(today);

    const [
      totalRoomsResult,
      occupiedRoomsResult,
      checkInsToday,
      checkOutsToday,
      activeBookingsResult,
      pendingDepositsResult,
      overdueBookings,
    ] = await Promise.all([
      db.select({ count: count() }).from(rooms).where(isNull(rooms.deletedAt)),
      db
        .select({ count: count() })
        .from(rooms)
        .where(and(eq(rooms.status, "OCCUPIED"), isNull(rooms.deletedAt))),
      db
        .select(bookingSelect)
        .from(bookings)
        .innerJoin(rooms, eq(bookings.roomId, rooms.id))
        .where(
          and(
            eq(bookings.checkInDate, today),
            inArray(bookings.status, ["RESERVED", "CHECKED_IN"]),
            isNull(bookings.deletedAt),
          ),
        )
        .orderBy(rooms.roomNumber),
      db
        .select(bookingSelect)
        .from(bookings)
        .innerJoin(rooms, eq(bookings.roomId, rooms.id))
        .where(
          and(
            eq(bookings.checkOutDate, today),
            eq(bookings.status, "CHECKED_IN"),
            isNull(bookings.deletedAt),
          ),
        )
        .orderBy(rooms.roomNumber),
      db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            inArray(bookings.status, ["RESERVED", "CHECKED_IN"]),
            isNull(bookings.deletedAt),
          ),
        ),
      db
        .selectDistinct({ bookingId: ledgerTransactions.bookingId })
        .from(ledgerTransactions)
        .innerJoin(bookings, eq(ledgerTransactions.bookingId, bookings.id))
        .where(
          and(
            eq(ledgerTransactions.category, "DEPOSIT"),
            eq(ledgerTransactions.isPaid, false),
            inArray(bookings.status, ["RESERVED", "CHECKED_IN"]),
            isNull(bookings.deletedAt),
          ),
        ),
      db
        .select(bookingSelect)
        .from(bookings)
        .innerJoin(rooms, eq(bookings.roomId, rooms.id))
        .where(
          and(
            eq(bookings.status, "CHECKED_IN"),
            lt(bookings.checkOutDate, today),
            isNull(bookings.deletedAt),
          ),
        )
        .orderBy(bookings.checkOutDate),
    ]);

    const totalRooms = totalRoomsResult[0]?.count ?? 0;
    const occupiedRooms = occupiedRoomsResult[0]?.count ?? 0;
    const rate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const overdueFlags: OverdueFlagRow[] = overdueBookings.map((booking) => ({
      ...booking,
      daysOverdue: Math.max(
        0,
        differenceInCalendarDays(
          todayDate,
          parseManilaDate(booking.checkOutDate),
        ),
      ),
    }));

    return {
      date: today,
      occupancy: {
        totalRooms,
        occupiedRooms,
        rate,
      },
      today: {
        checkIns: checkInsToday,
        checkOuts: checkOutsToday,
        checkInsCount: checkInsToday.length,
        checkOutsCount: checkOutsToday.length,
      },
      activeBookingsCount: activeBookingsResult[0]?.count ?? 0,
      pendingDepositsCount: pendingDepositsResult.length,
      overdueFlags,
    };
  });
