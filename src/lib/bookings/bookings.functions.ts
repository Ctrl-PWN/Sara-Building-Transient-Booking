import { createServerFn } from "@tanstack/react-start";
import {
	and,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/index";
import { bookings, ledgerTransactions, rooms } from "@/db/schema";
import { isSameManilaDayOrAfter } from "@/lib/date/manila";
import {
	computeRemainingBalance,
	normalizeReferenceNumber,
	RESERVATION_ADVANCE_DESCRIPTION,
	RESERVATION_BALANCE_DESCRIPTION,
	syncBookingPaymentStatus,
} from "@/lib/ledger/ledger.helpers";
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
import { calculateMonthlyPricing, calculateStayPricing } from "./stay-pricing";
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

export function generateBookingRef(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	const seq = String(Math.floor(Math.random() * 900) + 100);
	return `BK-${y}${m}${d}-${seq}`;
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

export const getBookings = createServerFn({ method: "GET" }).handler(
	async () => {
		return getBookingsFromDb();
	},
);

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

export const getBookingHistory = createServerFn({ method: "GET" }).handler(
	async () => {
		return getBookingHistoryFromDb();
	},
);

export const getBookingById = createServerFn({ method: "GET" })
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
	.validator(createBookingServerSchema)
	.handler(async ({ data }) => {
		const conflicts = await db
			.select({ id: bookings.id })
			.from(bookings)
			.where(
				and(
					eq(bookings.roomId, data.roomId),
					isNull(bookings.deletedAt),
					or(
						eq(bookings.status, "RESERVED"),
						eq(bookings.status, "CHECKED_IN"),
					),
					and(
						lte(bookings.checkIn, new Date(data.checkOut).toISOString()),
						gte(bookings.checkOut, new Date(data.checkIn).toISOString()),
					),
				),
			)
			.limit(1);

		if (conflicts.length > 0) {
			throw new Error(
				"Room is not available for the selected date and time. Please choose a different time slot.",
			);
		}

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
	.validator(updateStatusSchema)
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
			.limit(1);

		if (rows.length === 0) {
			throw new Error("Booking not found");
		}

		const updateData: Record<string, unknown> = {
			status: data.status,
		};

		if (data.status === "CANCELLED") {
			updateData.cancelledAt = sql`now()`;
			updateData.cancellationReason = data.cancellationReason ?? null;
		}

		if (data.status === "EVICTED") {
			updateData.cancelledAt = sql`now()`;
			updateData.cancellationReason = data.evictionReason ?? "Evicted";
		}

		await db
			.update(bookings)
			.set(updateData)
			.where(eq(bookings.bookingRef, data.bookingRef));

		const roomId = rows[0].roomId;

		if (data.status === "CHECKED_IN") {
			await db
				.update(rooms)
				.set({ status: "OCCUPIED" })
				.where(eq(rooms.id, roomId));
		} else if (["CANCELLED", "CHECKED_OUT", "EVICTED"].includes(data.status)) {
			await db
				.update(rooms)
				.set({ status: "AVAILABLE" })
				.where(eq(rooms.id, roomId));
		}

		return { success: true };
	});

export const checkInBooking = createServerFn({ method: "POST" })
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
	.validator(checkOutBookingSchema)
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
			.limit(1);

		if (!rows[0]) {
			throw new Error("Booking not found");
		}

		const booking = rows[0];

		if (booking.status !== "CHECKED_IN") {
			throw new Error("Only checked-in bookings can be checked out");
		}

		const remainingBalance = await computeRemainingBalance(booking.id, db);
		if (remainingBalance > 0) {
			throw new Error(
				"Cannot check out while there is an outstanding balance. Settle all charges first.",
			);
		}

		await db.transaction(async (tx) => {
			await tx
				.update(bookings)
				.set({ status: "CHECKED_OUT" })
				.where(eq(bookings.id, booking.id));

			await tx
				.update(rooms)
				.set({ status: "AVAILABLE" })
				.where(eq(rooms.id, booking.roomId));
		});

		return { success: true };
	});

export const transferBooking = createServerFn({ method: "POST" })
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

			const targetRoomRows = await tx
				.select({
					id: rooms.id,
					status: rooms.status,
					capacity: rooms.capacity,
					basePrice: rooms.basePrice,
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

			const { subtotal: stayTotal } = calculateStayPricing({
				basePrice: targetRoom.basePrice,
				checkIn: String(booking.checkIn),
				checkOut: String(booking.checkOut),
			});

			const newBookingRef = generateBookingRef();

			const ledgerLines = buildCreateBookingLedgerLines(
				{
					walkIn: true,
					bookingType: "DAILY",
					paymentMethod: "CASH",
					referenceNumber: undefined,
				},
				stayTotal,
			);

			await tx
				.update(bookings)
				.set({
					status: "TRANSFERRED",
					cancelledAt: sql`now()`,
					cancellationReason: data.reason,
				})
				.where(eq(bookings.id, booking.id));

			await tx
				.update(rooms)
				.set({ status: "AVAILABLE" })
				.where(eq(rooms.id, booking.roomId));

			const [newBooking] = await tx
				.insert(bookings)
				.values({
					bookingRef: newBookingRef,
					roomId: data.targetRoomId,
					firstName: booking.firstName,
					lastName: booking.lastName,
					contactNumber: booking.contactNumber,
					address: booking.address ?? "",
					checkIn: new Date().toISOString(),
					checkOut: new Date(booking.checkOut ?? "").toISOString(),
					occupantsCount: booking.occupantsCount,
					status: "CHECKED_IN",
					paymentStatus: "PAID_IN_FULL",
					bookingType: booking.bookingType,
					transferredFromBookingRef: booking.bookingRef,
					depositDeadline: booking.depositDeadline,
					finalDueDate: booking.finalDueDate,
					depositPctSnapshot: booking.depositPctSnapshot,
				})
				.returning();

			await tx.insert(ledgerTransactions).values(
				ledgerLines.map((line) => ({
					bookingId: newBooking.id,
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

			await tx
				.update(rooms)
				.set({ status: "OCCUPIED" })
				.where(eq(rooms.id, data.targetRoomId));

			return { bookingRef: newBookingRef };
		});

		return { success: true, bookingRef: result.bookingRef };
	});

export const extendBooking = createServerFn({ method: "POST" })
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

		const conflicts = await db
			.select({ id: bookings.id })
			.from(bookings)
			.where(
				and(
					eq(bookings.roomId, booking.roomId),
					isNull(bookings.deletedAt),
					or(
						eq(bookings.status, "RESERVED"),
						eq(bookings.status, "CHECKED_IN"),
					),
					and(
						lte(bookings.checkIn, newCheckOut.toISOString()),
						gte(bookings.checkOut, currentCheckOut.toISOString()),
					),
					ne(bookings.id, booking.id),
				),
			)
			.limit(1);

		if (conflicts.length > 0) {
			throw new Error(
				"Room is not available for the extended period. Please choose a different date.",
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

		const paymentMethod = data.paymentMethod;
		const referenceNumber = normalizeReferenceNumber(
			paymentMethod,
			data.referenceNumber,
		);

		await db.transaction(async (tx) => {
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
				isPaid: true,
				description: `Extension: ${months} month${months > 1 ? "s" : ""}`,
				paymentMethod,
				referenceNumber: referenceNumber?.trim() || null,
			});

			if (data.utilities && data.utilities.length > 0) {
				const requestedTypes = data.utilities.map((u) => u.utilityType);
				const dupes = await tx
					.select({ utilityType: ledgerTransactions.utilityType })
					.from(ledgerTransactions)
					.where(
						and(
							eq(ledgerTransactions.bookingId, booking.id),
							isNotNull(ledgerTransactions.utilityType),
							inArray(ledgerTransactions.utilityType, requestedTypes),
							gte(ledgerTransactions.createdAt, currentCheckOut.toISOString()),
							lt(ledgerTransactions.createdAt, newCheckOut.toISOString()),
						),
					);

				if (dupes.length > 0) {
					const types = Array.from(
						new Set(
							dupes
								.map((d) => d.utilityType)
								.filter((t): t is NonNullable<typeof t> => t !== null),
						),
					);
					throw new Error(
						`Utility charges already exist for this period: ${types.join(", ")}`,
					);
				}

				await tx.insert(ledgerTransactions).values(
					data.utilities.map((u) => ({
						bookingId: booking.id,
						category: "ROOM_CHARGE" as const,
						amount: u.amount.toFixed(4),
						isPaid: u.isPaid,
						description: u.description.trim(),
						utilityType: u.utilityType,
						paymentMethod: u.isPaid ? u.paymentMethod : null,
						referenceNumber:
							u.isPaid && u.referenceNumber ? u.referenceNumber.trim() : null,
					})),
				);
			}

			await syncBookingPaymentStatus(booking.id, tx);
		});

		return { success: true, newCheckOut: newCheckOut.toISOString() };
	});

const previewLateFeeSchema = z.object({
	bookingId: z.number().int().positive(),
});

export const previewLateFee = createServerFn({ method: "GET" })
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
	.validator(applyLateFeeSchema)
	.handler(async ({ data }) => {
		const rows = await db
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

		const existing = await db
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

		await db.transaction(async (tx) => {
			await tx.insert(ledgerTransactions).values({
				bookingId: row.id,
				category: "LATE_FEE",
				amount: fee.amount.toFixed(4),
				isPaid: false,
				description: fee.description,
			});

			await syncBookingPaymentStatus(row.id, tx);
		});

		return { applied: true as const, fee, reused: false };
	});
