import { createServerFn } from "@tanstack/react-start";
import {
	and,
	desc,
	eq,
	gte,
	inArray,
	isNull,
	lte,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/index";
import { bookings, ledgerTransactions, rooms } from "@/db/schema";
import { isSameManilaDayOrAfter, todayIsoInManila } from "@/lib/date/manila";
import {
	computeRemainingBalance,
	type DbClient,
	normalizeReferenceNumber,
	RESERVATION_ADVANCE_DESCRIPTION,
	RESERVATION_BALANCE_DESCRIPTION,
	syncBookingPaymentStatus,
} from "@/lib/ledger/ledger.helpers";
import { sessionMiddleware } from "@/lib/require-admin";
import { buildCreateBookingLedgerLines } from "./create-booking-ledger";
import { computeLateFee, type LateFeePreview } from "./late-fee";
import {
	bookingByIdSchema,
	bookingStatusSchema,
	checkInBookingSchema,
	checkOutBookingSchema,
	createBookingServerSchema,
	extendBookingSchema,
	transferBookingSchema,
	updateStatusSchema,
} from "./schemas";
import {
	calculateMonthlyPricing,
	calculateStayPricing,
	toDecimalString,
} from "./stay-pricing";
import type { BookingPaymentStatus, BookingWithRoom } from "./types";

function toISOString(value: string | Date | null): string {
	if (value == null) return "";
	if (typeof value === "string") {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
	}
	return value.toISOString();
}

function mapBookingRow(row: {
	id: number;
	bookingRef: string;
	firstName: string;
	lastName: string;
	contactNumber: string | null;
	address: string | null;
	roomId: number;
	roomNumber: string;
	roomType: string;
	roomBasePrice: string | null;
	roomMonthlyPrice: string | null;
	transferredFromBookingRef: string | null;
	checkIn: string | Date | null;
	checkOut: string | Date | null;
	occupantsCount: number;
	status: string;
	paymentStatus: string;
	bookingType: string;
	depositDeadline: Date | string | null;
	finalDueDate: Date | string | null;
	depositPctSnapshot: string | null;
	cancellationReason: string | null;
	cancelledAt: Date | string | null;
	createdAt: Date | string | null;
	deletedAt: Date | string | null;
}): BookingWithRoom {
	return {
		id: row.id,
		bookingRef: row.bookingRef,
		firstName: row.firstName,
		lastName: row.lastName,
		contactNumber: row.contactNumber,
		address: row.address ?? "",
		roomId: row.roomId,
		roomNumber: row.roomNumber,
		roomType: row.roomType,
		roomBasePrice: row.roomBasePrice,
		roomMonthlyPrice: row.roomMonthlyPrice,
		transferredFromBookingRef: row.transferredFromBookingRef,
		checkIn: toISOString(row.checkIn),
		checkOut: toISOString(row.checkOut),
		occupantsCount: row.occupantsCount,
		status: bookingStatusSchema.parse(row.status),
		paymentStatus: row.paymentStatus as BookingPaymentStatus,
		bookingType: row.bookingType as BookingWithRoom["bookingType"],
		depositDeadline: row.depositDeadline,
		finalDueDate: row.finalDueDate,
		depositPctSnapshot: row.depositPctSnapshot ?? "",
		cancellationReason: row.cancellationReason,
		cancelledAt: row.cancelledAt,
		createdAt: row.createdAt,
		deletedAt: row.deletedAt,
	};
}

const bookingSelect = {
	id: bookings.id,
	bookingRef: bookings.bookingRef,
	firstName: bookings.firstName,
	lastName: bookings.lastName,
	contactNumber: bookings.contactNumber,
	address: bookings.address,
	roomId: bookings.roomId,
	roomNumber: rooms.roomNumber,
	roomType: rooms.type,
	roomBasePrice: rooms.basePrice,
	roomMonthlyPrice: rooms.monthlyPrice,
	transferredFromBookingRef: bookings.transferredFromBookingRef,
	checkIn: bookings.checkIn,
	checkOut: bookings.checkOut,
	occupantsCount: bookings.occupantsCount,
	status: bookings.status,
	paymentStatus: bookings.paymentStatus,
	bookingType: bookings.bookingType,
	depositDeadline: bookings.depositDeadline,
	finalDueDate: bookings.finalDueDate,
	depositPctSnapshot: bookings.depositPctSnapshot,
	cancellationReason: bookings.cancellationReason,
	cancelledAt: bookings.cancelledAt,
	createdAt: bookings.createdAt,
	deletedAt: bookings.deletedAt,
};

const ACTIVE_BOOKING_STATUSES = ["RESERVED", "CHECKED_IN"] as const;
const ROOM_LOCK_NAMESPACE = 41;
const BOOKING_LEDGER_LOCK_NAMESPACE = 42;

async function lockRoomForBooking(tx: DbClient, roomId: number) {
	await tx.execute(sql`select pg_advisory_xact_lock(${ROOM_LOCK_NAMESPACE}, ${roomId})`);
}

async function lockBookingLedger(tx: DbClient, bookingId: number) {
	await tx.execute(
		sql`select pg_advisory_xact_lock(${BOOKING_LEDGER_LOCK_NAMESPACE}, ${bookingId})`,
	);
}

async function findRoomBookingConflict(
	tx: DbClient,
	args: {
		roomId: number;
		checkIn: string;
		checkOut: string;
		excludeBookingId?: number;
	},
) {
	const predicates = [
		eq(bookings.roomId, args.roomId),
		isNull(bookings.deletedAt),
		inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
		lte(bookings.checkIn, args.checkOut),
		gte(bookings.checkOut, args.checkIn),
	];

	if (args.excludeBookingId != null) {
		predicates.push(ne(bookings.id, args.excludeBookingId));
	}

	const conflicts = await tx
		.select({ id: bookings.id })
		.from(bookings)
		.where(and(...predicates))
		.limit(1);

	return conflicts[0] ?? null;
}

async function syncRoomOccupancy(tx: DbClient, roomId: number) {
	const checkedIn = await tx
		.select({ id: bookings.id })
		.from(bookings)
		.where(
			and(
				eq(bookings.roomId, roomId),
				eq(bookings.status, "CHECKED_IN"),
				isNull(bookings.deletedAt),
			),
		)
		.limit(1);

	await tx
		.update(rooms)
		.set({ status: checkedIn[0] ? "OCCUPIED" : "AVAILABLE" })
		.where(eq(rooms.id, roomId));
}

export function generateBookingRef(): string {
	const ymd = todayIsoInManila().replaceAll("-", "");
	const seq = String(Math.floor(Math.random() * 900) + 100);
	return `BK-${ymd}-${seq}`;
}

async function getBookingsFromDb(): Promise<BookingWithRoom[]> {
	const rows = await db
		.select(bookingSelect)
		.from(bookings)
		.innerJoin(rooms, eq(bookings.roomId, rooms.id))
		.where(
			and(
				isNull(bookings.deletedAt),
				or(eq(bookings.status, "RESERVED"), eq(bookings.status, "CHECKED_IN")),
			),
		)
		.orderBy(desc(bookings.createdAt));

	return rows.map(mapBookingRow);
}

export const getBookings = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.handler(async () => {
		return getBookingsFromDb();
	});

async function getBookingHistoryFromDb(): Promise<BookingWithRoom[]> {
	const rows = await db
		.select(bookingSelect)
		.from(bookings)
		.innerJoin(rooms, eq(bookings.roomId, rooms.id))
		.where(
			and(
				isNull(bookings.deletedAt),
				inArray(bookings.status, [
					"CHECKED_OUT",
					"CANCELLED",
					"EVICTED",
					"TRANSFERRED",
				]),
			),
		)
		.orderBy(
			desc(sql`COALESCE(${bookings.cancelledAt}, ${bookings.checkOut})`),
		);

	return rows.map(mapBookingRow);
}

export const getBookingHistory = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.handler(async () => {
		return getBookingHistoryFromDb();
	});

export const getBookingById = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.validator(bookingByIdSchema)
	.handler(async ({ data }) => {
		const rows = await db
			.select(bookingSelect)
			.from(bookings)
			.innerJoin(rooms, eq(bookings.roomId, rooms.id))
			.where(and(eq(bookings.id, data.id), isNull(bookings.deletedAt)))
			.limit(1);

		if (!rows[0]) {
			throw new Error("Booking not found");
		}

		return mapBookingRow(rows[0]);
	});

const bookingRefSchema = z.object({
	bookingRef: z.string().min(1, "Booking reference is required"),
});

export const getBookingByRef = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.validator(bookingRefSchema)
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
			.limit(1);

		return rows[0] ? mapBookingRow(rows[0]) : null;
	});

export const createBooking = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(createBookingServerSchema)
	.handler(async ({ data }) => {
		const roomRows = await db
			.select({
				capacity: rooms.capacity,
				basePrice: rooms.basePrice,
				monthlyPrice: rooms.monthlyPrice,
			})
			.from(rooms)
			.where(eq(rooms.id, data.roomId))
			.limit(1);

		if (roomRows.length === 0) {
			throw new Error("Room not found");
		}

		const room = roomRows[0];
		if (data.occupantsCount > room.capacity) {
			throw new Error("Occupants exceed this room's capacity");
		}

		const isMonthly = data.bookingType === "MONTHLY";

		if (isMonthly && !room.monthlyPrice) {
			throw new Error(
				"This room does not have a monthly rate configured. Please set a monthly price for this room first.",
			);
		}

		let stayTotal: number;
		if (isMonthly) {
			const durationMonths = data.monthlyDuration ?? 1;
			const { subtotal } = calculateMonthlyPricing({
				monthlyPrice: room.monthlyPrice ?? 0,
				durationMonths: Math.max(1, durationMonths),
			});
			stayTotal = subtotal;
		} else {
			const pricing = calculateStayPricing({
				basePrice: room.basePrice,
				checkIn: data.checkIn,
				checkOut: data.checkOut,
			});
			stayTotal = pricing.subtotal;
		}

		const ledgerLines = buildCreateBookingLedgerLines(
			{
				walkIn: data.walkIn,
				bookingType: data.bookingType,
				paymentMethod: data.paymentMethod,
				referenceNumber: data.referenceNumber,
				reservationFeeType: data.reservationFeeType,
				reservationFeeValue: data.reservationFeeValue,
				monthlyPrice: isMonthly
					? room.monthlyPrice
						? Number(room.monthlyPrice)
						: undefined
					: undefined,
				hasAdvance: isMonthly ? data.hasAdvance : undefined,
			},
			stayTotal,
		);

		const checkIn = new Date(data.checkIn);
		const checkOut = new Date(data.checkOut);
		const depositHours = 24;
		const depositDeadline = new Date(
			checkIn.getTime() - depositHours * 60 * 60 * 1000,
		).toISOString();
		const finalDueDate = new Date(
			checkOut.getTime() + 7 * 24 * 60 * 60 * 1000,
		).toISOString();

		const bookingRef = generateBookingRef();
		const status = data.walkIn ? "CHECKED_IN" : "RESERVED";
		const paymentStatus = data.walkIn ? "PAID_IN_FULL" : "CURRENT";

		const { bookingId } = await db.transaction(async (tx) => {
			await lockRoomForBooking(tx, data.roomId);
			const conflict = await findRoomBookingConflict(tx, {
				roomId: data.roomId,
				checkIn: new Date(data.checkIn).toISOString(),
				checkOut: new Date(data.checkOut).toISOString(),
			});

			if (conflict) {
				throw new Error(
					"Room is not available for the selected date and time. Please choose a different time slot.",
				);
			}

			const [row] = await tx
				.insert(bookings)
				.values({
					bookingRef,
					roomId: data.roomId,
					firstName: data.firstName,
					lastName: data.lastName,
					contactNumber: data.contactNumber,
					address: data.address,
					checkIn: new Date(data.checkIn).toISOString(),
					checkOut: new Date(data.checkOut).toISOString(),
					occupantsCount: data.occupantsCount,
					status,
					paymentStatus,
					bookingType: data.bookingType,
					depositDeadline,
					finalDueDate,
					depositPctSnapshot: data.depositPercentage.toFixed(2),
				})
				.returning();

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
			);

			await syncBookingPaymentStatus(row.id, tx);

			if (data.walkIn) {
				await tx
					.update(rooms)
					.set({ status: "OCCUPIED" })
					.where(eq(rooms.id, data.roomId));
			}

			return { bookingId: row.id };
		});

		return { success: true, bookingRef, bookingId };
	});

export const updateBookingStatus = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(updateStatusSchema)
	.handler(async ({ data }) => {
		const rows = await db
			.select({
				id: bookings.id,
				roomId: bookings.roomId,
				status: bookings.status,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.bookingRef, data.bookingRef),
					isNull(bookings.deletedAt),
				),
			)
			.limit(1);

		if (rows.length === 0) {
			throw new Error("Booking not found");
		}

		const updateData: Record<string, unknown> = {
			status: data.status,
		};

		if (data.status === "CANCELLED") {
			if (rows[0].status !== "RESERVED") {
				throw new Error("Only reserved bookings can be cancelled");
			}
			updateData.cancelledAt = sql`now()`;
			updateData.cancellationReason = data.cancellationReason ?? null;
		} else if (data.status === "EVICTED") {
			if (rows[0].status !== "CHECKED_IN") {
				throw new Error("Only checked-in bookings can be evicted");
			}
			updateData.cancelledAt = sql`now()`;
			updateData.cancellationReason = data.evictionReason ?? "Evicted";
		} else {
			throw new Error("Use the dedicated flow for this booking status change");
		}

		const roomId = rows[0].roomId;

		await db.transaction(async (tx) => {
			await tx
				.update(bookings)
				.set(updateData)
				.where(eq(bookings.bookingRef, data.bookingRef));

			if (data.status === "EVICTED") {
				await syncRoomOccupancy(tx, roomId);
			}
		});

		return { success: true };
	});

export const checkInBooking = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(checkInBookingSchema)
	.handler(async ({ data }) => {
		const rows = await db
			.select({
				id: bookings.id,
				status: bookings.status,
				roomId: bookings.roomId,
				checkIn: bookings.checkIn,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.bookingRef, data.bookingRef),
					isNull(bookings.deletedAt),
				),
			)
			.limit(1);

		if (!rows[0]) {
			throw new Error("Booking not found");
		}

		const booking = rows[0];

		if (booking.status !== "RESERVED") {
			throw new Error("Only reserved bookings can be checked in");
		}

		if (!booking.checkIn) {
			throw new Error("Booking has no scheduled check-in date");
		}

		if (!isSameManilaDayOrAfter(booking.checkIn)) {
			throw new Error("Cannot check in before the scheduled check-in date");
		}

		const unpaidLines = await db
			.select()
			.from(ledgerTransactions)
			.where(
				and(
					eq(ledgerTransactions.bookingId, booking.id),
					eq(ledgerTransactions.isPaid, false),
					or(
						eq(ledgerTransactions.category, "ROOM_CHARGE"),
						eq(ledgerTransactions.category, "ADVANCE"),
					),
				),
			);

		if (unpaidLines.length === 0) {
			throw new Error("No unpaid balance to settle at check-in");
		}

		const invalidLine = unpaidLines.find(
			(line) =>
				line.description !== RESERVATION_BALANCE_DESCRIPTION &&
				line.description !== RESERVATION_ADVANCE_DESCRIPTION,
		);
		if (invalidLine) {
			throw new Error(
				"Unpaid balance does not match reservation ledger expectations",
			);
		}

		const referenceNumber = normalizeReferenceNumber(
			data.paymentMethod,
			data.referenceNumber,
		);

		await db.transaction(async (tx) => {
			await tx
				.update(ledgerTransactions)
				.set({
					isPaid: true,
					paymentMethod: data.paymentMethod,
					referenceNumber,
				})
				.where(
					and(
						eq(ledgerTransactions.bookingId, booking.id),
						eq(ledgerTransactions.isPaid, false),
						or(
							eq(ledgerTransactions.category, "ROOM_CHARGE"),
							eq(ledgerTransactions.category, "ADVANCE"),
						),
					),
				);

			await tx
				.update(bookings)
				.set({ status: "CHECKED_IN" })
				.where(eq(bookings.id, booking.id));

			await syncBookingPaymentStatus(booking.id, tx);

			await tx
				.update(rooms)
				.set({ status: "OCCUPIED" })
				.where(eq(rooms.id, booking.roomId));
		});

		return { success: true };
	});

export const checkOutBooking = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(checkOutBookingSchema)
	.handler(async ({ data }) => {
		const rows = await db
			.select({
				id: bookings.id,
				status: bookings.status,
				roomId: bookings.roomId,
				checkOut: bookings.checkOut,
				basePrice: rooms.basePrice,
			})
			.from(bookings)
			.innerJoin(rooms, eq(bookings.roomId, rooms.id))
			.where(
				and(
					eq(bookings.bookingRef, data.bookingRef),
					isNull(bookings.deletedAt),
				),
			)
			.limit(1);

		if (!rows[0]) {
			throw new Error("Booking not found");
		}

		const booking = rows[0];

		if (booking.status !== "CHECKED_IN") {
			throw new Error("Only checked-in bookings can be checked out");
		}

		if (!booking.checkOut) {
			throw new Error("Booking has no scheduled check-out date");
		}
		const scheduledCheckOut = booking.checkOut;

		await db.transaction(async (tx) => {
			await lockBookingLedger(tx, booking.id);

			const remainingBalance = await computeRemainingBalance(booking.id, tx);
			if (remainingBalance > 0) {
				throw new Error(
					"Cannot check out while there is an outstanding balance. Settle all charges first.",
				);
			}

			const fee = computeLateFee({
				checkOut: scheduledCheckOut,
				roomBasePrice: booking.basePrice,
			});

			if (fee) {
				if (!data.paymentMethod) {
					throw new Error("Payment method is required for the late fee");
				}

				await tx.insert(ledgerTransactions).values({
					bookingId: booking.id,
					category: "LATE_FEE",
					amount: toDecimalString(fee.amount),
					isPaid: true,
					description: fee.description,
					paymentMethod: data.paymentMethod,
					referenceNumber: normalizeReferenceNumber(
						data.paymentMethod,
						data.referenceNumber,
					),
				});

				await syncBookingPaymentStatus(booking.id, tx);
			}

			await tx
				.update(bookings)
				.set({ status: "CHECKED_OUT" })
				.where(eq(bookings.id, booking.id));

			await syncRoomOccupancy(tx, booking.roomId);
		});

		return { success: true };
	});

export const transferBooking = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(transferBookingSchema)
	.handler(async ({ data }) => {
		const result = await db.transaction(async (tx) => {
			const rows = await tx
				.select(bookingSelect)
				.from(bookings)
				.innerJoin(rooms, eq(bookings.roomId, rooms.id))
				.where(
					and(
						eq(bookings.bookingRef, data.bookingRef),
						isNull(bookings.deletedAt),
					),
				)
				.limit(1);

			if (!rows[0]) {
				throw new Error("Booking not found");
			}

			const booking = rows[0];

			if (booking.status !== "CHECKED_IN") {
				throw new Error("Only checked-in bookings can be transferred");
			}

			if (booking.roomId === data.targetRoomId) {
				throw new Error("Target room must be different from current room");
			}

			if (!booking.checkOut) {
				throw new Error("Booking has no scheduled check-out date");
			}

			for (const roomId of [booking.roomId, data.targetRoomId].sort(
				(a, b) => a - b,
			)) {
				await lockRoomForBooking(tx, roomId);
			}
			await lockBookingLedger(tx, booking.id);

			const targetRoomRows = await tx
				.select({
					id: rooms.id,
					status: rooms.status,
					capacity: rooms.capacity,
				})
				.from(rooms)
				.where(and(eq(rooms.id, data.targetRoomId), isNull(rooms.deletedAt)))
				.limit(1);

			if (!targetRoomRows[0]) {
				throw new Error("Target room not found");
			}

			const targetRoom = targetRoomRows[0];

			if (targetRoom.status !== "AVAILABLE") {
				throw new Error("Target room is not available");
			}

			if (booking.occupantsCount > targetRoom.capacity) {
				throw new Error("Occupants exceed the target room's capacity");
			}

			const transferCheckIn = new Date().toISOString();
			const transferCheckOut = new Date(booking.checkOut).toISOString();
			const conflict = await findRoomBookingConflict(tx, {
				roomId: data.targetRoomId,
				checkIn: transferCheckIn,
				checkOut: transferCheckOut,
				excludeBookingId: booking.id,
			});

			if (conflict) {
				throw new Error("Target room has an overlapping active booking");
			}

			const newBookingRef = generateBookingRef();

			await tx
				.update(bookings)
				.set({
					status: "TRANSFERRED",
					cancelledAt: sql`now()`,
					cancellationReason: data.reason,
				})
				.where(eq(bookings.id, booking.id));

			const [newBooking] = await tx
				.insert(bookings)
				.values({
					bookingRef: newBookingRef,
					roomId: data.targetRoomId,
					firstName: booking.firstName,
					lastName: booking.lastName,
					contactNumber: booking.contactNumber,
					address: booking.address ?? "",
					checkIn: transferCheckIn,
					checkOut: transferCheckOut,
					occupantsCount: booking.occupantsCount,
					status: "CHECKED_IN",
					paymentStatus: booking.paymentStatus,
					bookingType: booking.bookingType,
					transferredFromBookingRef: booking.bookingRef,
					depositDeadline: booking.depositDeadline,
					finalDueDate: booking.finalDueDate,
					depositPctSnapshot: booking.depositPctSnapshot,
				})
				.returning();

			await tx
				.update(ledgerTransactions)
				.set({ bookingId: newBooking.id })
				.where(eq(ledgerTransactions.bookingId, booking.id));

			await syncBookingPaymentStatus(newBooking.id, tx);
			await syncRoomOccupancy(tx, booking.roomId);
			await tx
				.update(rooms)
				.set({ status: "OCCUPIED" })
				.where(eq(rooms.id, data.targetRoomId));

			return { bookingRef: newBookingRef };
		});

		return { success: true, bookingRef: result.bookingRef };
	});

export const extendBooking = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(extendBookingSchema)
	.handler(async ({ data }) => {
		const rows = await db
			.select({
				id: bookings.id,
				status: bookings.status,
				roomId: bookings.roomId,
				checkIn: bookings.checkIn,
				checkOut: bookings.checkOut,
				bookingType: bookings.bookingType,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.bookingRef, data.bookingRef),
					isNull(bookings.deletedAt),
				),
			)
			.limit(1);

		if (!rows[0]) {
			throw new Error("Booking not found");
		}

		const booking = rows[0];

		if (booking.status !== "CHECKED_IN") {
			throw new Error("Only checked-in bookings can be extended");
		}

		if (booking.bookingType !== "MONTHLY") {
			throw new Error("Only monthly bookings can be extended");
		}

		if (!booking.checkOut) {
			throw new Error("Booking has no check-out date");
		}

		const currentCheckOut = new Date(booking.checkOut);
		const newCheckOut = new Date(data.newCheckOutDate);

		if (newCheckOut <= currentCheckOut) {
			throw new Error(
				"New checkout date must be after the current checkout date",
			);
		}

		const roomRows = await db
			.select({
				monthlyPrice: rooms.monthlyPrice,
			})
			.from(rooms)
			.where(eq(rooms.id, booking.roomId))
			.limit(1);

		if (roomRows.length === 0 || !roomRows[0].monthlyPrice) {
			throw new Error("Room monthly price not configured");
		}

		const monthlyPrice = Number(roomRows[0].monthlyPrice);
		const diffMs = newCheckOut.getTime() - currentCheckOut.getTime();
		const months = Math.max(1, Math.round(diffMs / (30 * 24 * 60 * 60 * 1000)));
		const totalAmount = monthlyPrice * months;

		const isPaid = !data.withCashAdvance;
		const referenceNumber = isPaid
			? normalizeReferenceNumber(data.paymentMethod, data.referenceNumber)
			: null;

		await db.transaction(async (tx) => {
			await lockRoomForBooking(tx, booking.roomId);
			const conflict = await findRoomBookingConflict(tx, {
				roomId: booking.roomId,
				checkIn: currentCheckOut.toISOString(),
				checkOut: newCheckOut.toISOString(),
				excludeBookingId: booking.id,
			});

			if (conflict) {
				throw new Error(
					"Room is not available for the extended period. Please choose a different date.",
				);
			}

			await tx
				.update(bookings)
				.set({
					checkOut: newCheckOut.toISOString(),
					finalDueDate: new Date(
						newCheckOut.getTime() + 7 * 24 * 60 * 60 * 1000,
					).toISOString(),
				})
				.where(eq(bookings.id, booking.id));

			await tx.insert(ledgerTransactions).values({
				bookingId: booking.id,
				category: "ROOM_CHARGE",
				amount: totalAmount.toFixed(4),
				isPaid,
				description: `Extension: ${months} month${months > 1 ? "s" : ""}`,
				paymentMethod: isPaid ? data.paymentMethod : null,
				referenceNumber,
			});

			await syncBookingPaymentStatus(booking.id, tx);
		});

		return { success: true, newCheckOut: newCheckOut.toISOString() };
	});

const previewLateFeeSchema = z.object({
	bookingId: z.number().int().positive(),
});

export const previewLateFee = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.validator(previewLateFeeSchema)
	.handler(async ({ data }): Promise<LateFeePreview | null> => {
		const rows = await db
			.select({
				checkOut: bookings.checkOut,
				status: bookings.status,
				basePrice: rooms.basePrice,
			})
			.from(bookings)
			.innerJoin(rooms, eq(rooms.id, bookings.roomId))
			.where(and(eq(bookings.id, data.bookingId), isNull(bookings.deletedAt)))
			.limit(1);

		const row = rows[0];
		if (row?.status !== "CHECKED_IN" || !row.checkOut) return null;

		return computeLateFee({
			checkOut: row.checkOut,
			roomBasePrice: row.basePrice,
		});
	});

const applyLateFeeSchema = z.object({
	bookingId: z.number().int().positive(),
});

export const applyLateFee = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(applyLateFeeSchema)
	.handler(async ({ data }) => {
		return await db.transaction(async (tx) => {
			await lockBookingLedger(tx, data.bookingId);

			const rows = await tx
				.select({
					id: bookings.id,
					checkOut: bookings.checkOut,
					status: bookings.status,
					basePrice: rooms.basePrice,
				})
				.from(bookings)
				.innerJoin(rooms, eq(rooms.id, bookings.roomId))
				.where(and(eq(bookings.id, data.bookingId), isNull(bookings.deletedAt)))
				.limit(1);

			const row = rows[0];
			if (row?.status !== "CHECKED_IN" || !row.checkOut) {
				throw new Error("Booking is not checked in or has been deleted");
			}

			const fee = computeLateFee({
				checkOut: row.checkOut,
				roomBasePrice: row.basePrice,
			});
			if (!fee) {
				return { applied: false as const };
			}

			const existing = await tx
				.select({ id: ledgerTransactions.id })
				.from(ledgerTransactions)
				.where(
					and(
						eq(ledgerTransactions.bookingId, row.id),
						eq(ledgerTransactions.category, "LATE_FEE"),
						eq(ledgerTransactions.isPaid, false),
					),
				)
				.limit(1);

			if (existing[0]) {
				return { applied: true as const, fee, reused: true };
			}

			await tx.insert(ledgerTransactions).values({
				bookingId: row.id,
				category: "LATE_FEE",
				amount: toDecimalString(fee.amount),
				isPaid: false,
				description: fee.description,
			});

			await syncBookingPaymentStatus(row.id, tx);

			return { applied: true as const, fee, reused: false };
		});
	});
