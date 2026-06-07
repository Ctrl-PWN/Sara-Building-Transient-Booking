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
	checkInDate: string;
	checkOutDate: string;
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
		roomId: row.roomId,
		roomNumber: row.roomNumber,
		checkInDate: row.checkInDate,
		checkOutDate: row.checkOutDate,
		occupantsCount: row.occupantsCount,
		status: bookingStatusSchema.parse(row.status),
		paymentStatus: row.paymentStatus as BookingPaymentStatus,
		roomType: "",
		roomBasePrice: null,
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
				checkInDate: bookings.checkInDate,
				checkOutDate: bookings.checkOutDate,
				occupantsCount: bookings.occupantsCount,
				status: bookings.status,
				paymentStatus: bookings.paymentStatus,
			})
			.from(bookings)
			.innerJoin(rooms, eq(bookings.roomId, rooms.id))
			.where(
				and(
					lt(bookings.checkInDate, weekEnd),
					gt(bookings.checkOutDate, weekStart),
					isNull(bookings.deletedAt),
					ne(bookings.status, "CANCELLED"),
				),
			)
			.orderBy(asc(bookings.checkInDate)),
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
	.inputValidator(timelineWeekSchema)
	.handler(async ({ data }) => {
		const weekEnd = getWeekEnd(data.weekStart);
		return getTimelineWeekFromDb(data.weekStart, weekEnd);
	});
