import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, gt, isNull, lt, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { bookings, rooms } from "@/db/schema";
import { bookingStatusSchema } from "@/lib/bookings/schemas";
import type {
	BookingPaymentStatus,
	BookingWithRoom,
} from "@/lib/bookings/types";

import type { TimelineWeekData } from "./types";
import { getWeekDays, getWeekEnd } from "./week";

function toISOString(value: string | Date | null): string {
	if (value == null) return "";
	if (typeof value === "string") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
	}
	return value.toISOString();
}

const timelineWeekSchema = z.object({
	weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function mapBookingRow(row: {
	id: number;
	bookingRef: string;
	firstName: string;
	lastName: string;
	contactNumber: string | null;
	roomId: number;
	roomNumber: string;
	checkIn: string | Date | null;
	checkOut: string | Date | null;
	occupantsCount: number;
	status: string;
	paymentStatus: string;
}): BookingWithRoom {
	return {
		id: row.id,
		bookingRef: row.bookingRef,
		firstName: row.firstName,
		lastName: row.lastName,
		contactNumber: row.contactNumber,
		address: "",
		roomId: row.roomId,
		roomNumber: row.roomNumber,
		checkIn: toISOString(row.checkIn),
		checkOut: toISOString(row.checkOut),
		occupantsCount: row.occupantsCount,
		status: bookingStatusSchema.parse(row.status),
		paymentStatus: row.paymentStatus as BookingPaymentStatus,
		roomType: "",
		roomBasePrice: null,
		roomMonthlyPrice: null,
		transferredFromBookingRef: null,
		bookingType: "DAILY",
		depositDeadline: null,
		finalDueDate: null,
		depositPctSnapshot: "",
		cancellationReason: null,
		cancelledAt: null,
		createdAt: null,
		deletedAt: null,
	};
}

async function getTimelineWeekFromDb(
	weekStart: string,
	weekEnd: string,
): Promise<TimelineWeekData> {
	const [roomRows, bookingRows] = await Promise.all([
		db
			.select({
				id: rooms.id,
				roomNumber: rooms.roomNumber,
				type: rooms.type,
			})
			.from(rooms)
			.where(isNull(rooms.deletedAt))
			.orderBy(asc(rooms.roomNumber)),
		db
			.select({
				id: bookings.id,
				bookingRef: bookings.bookingRef,
				firstName: bookings.firstName,
				lastName: bookings.lastName,
				contactNumber: bookings.contactNumber,
				roomId: bookings.roomId,
				roomNumber: rooms.roomNumber,
				checkIn: bookings.checkIn,
				checkOut: bookings.checkOut,
				occupantsCount: bookings.occupantsCount,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
			})
			.from(bookings)
			.innerJoin(rooms, eq(bookings.roomId, rooms.id))
			.where(
				and(
					lt(bookings.checkIn, new Date(weekEnd).toISOString()),
					gt(bookings.checkOut, new Date(weekStart).toISOString()),
					isNull(bookings.deletedAt),
					ne(bookings.status, "CANCELLED"),
					ne(bookings.status, "TRANSFERRED"),
				),
			)
			.orderBy(asc(bookings.checkIn)),
	]);

	return {
		weekStart,
		weekEnd,
		days: getWeekDays(weekStart),
		rooms: roomRows,
		bookings: bookingRows.map(mapBookingRow),
	};
}

export const getTimelineWeek = createServerFn({ method: "GET" })
	.validator(timelineWeekSchema)
	.handler(async ({ data }) => {
		const weekEnd = getWeekEnd(data.weekStart);
		return getTimelineWeekFromDb(data.weekStart, weekEnd);
	});
