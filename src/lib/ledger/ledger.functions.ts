import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, ledgerTransactions } from "@/db/schema";
import type { PaymentMethod } from "@/db/schema/enums";
import { sessionMiddleware } from "@/lib/require-admin";
import {
	isWithinPeriod,
	listMonthlyBillingPeriods,
} from "@/lib/bookings/monthly-billing-periods";
import {
	type DbClient,
	getBookingForLedger,
	getLedgerTransactionWithBooking,
	isProtectedLedgerTransaction,
	normalizeReferenceNumber,
	syncBookingPaymentStatus,
} from "./ledger.helpers";
import {
	createExpenseSchema,
	deleteLedgerTransactionSchema,
	generateUtilityPaymentsSchema,
	getLedgerDetailsSchema,
	getLedgerTransactionsSchema,
	payExpenseSchema,
	payExpensesBulkSchema,
	payExpensesSchema,
} from "./schemas";
import type { LedgerDetails } from "./types";

const LEDGER_LOCK_NAMESPACE = 43;

async function lockBookingLedger(
	tx: DbClient,
	bookingId: number,
) {
	await tx.execute(
		sql`select pg_advisory_xact_lock(${LEDGER_LOCK_NAMESPACE}, ${bookingId})`,
	);
}

export const createExpense = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(createExpenseSchema)
	.handler(async ({ data }) => {
		const isPaid = data.isPaid ?? false;
		const referenceNumber = isPaid
			? normalizeReferenceNumber(
					data.paymentMethod as PaymentMethod,
					data.referenceNumber,
				)
			: null;

		const row = await db.transaction(async (tx) => {
			await lockBookingLedger(tx, data.bookingId);
			const booking = await getBookingForLedger(data.bookingId, tx);
			if (booking.status !== "CHECKED_IN") {
				throw new Error(
					"Charges can only be added while the guest is checked in",
				);
			}

			const [inserted] = await tx
				.insert(ledgerTransactions)
				.values({
					bookingId: data.bookingId,
					category: data.category ?? "ROOM_CHARGE",
					amount: String(data.amount),
					description: data.description,
					isPaid,
					paymentMethod: isPaid ? data.paymentMethod : null,
					referenceNumber,
					utilityType: data.utilityType ?? null,
				})
				.returning();

			await syncBookingPaymentStatus(data.bookingId, tx);
			return inserted;
		});

		return row;
	});

export const generateUtilityPayments = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(generateUtilityPaymentsSchema)
	.handler(async ({ data }) => {
		const booking = await getBookingForLedger(data.bookingId, db);
		if (booking.status !== "CHECKED_IN") {
			throw new Error(
				"Utility payments can only be generated while the guest is checked in",
			);
		}

		const payableItems = data.items.filter((i) => i.amount > 0);
		if (payableItems.length === 0) {
			throw new Error(
				"At least one utility with an amount greater than zero is required",
			);
		}

		const result = await db.transaction(async (tx) => {
			await lockBookingLedger(tx, data.bookingId);
			const bookingRow = await tx
				.select({
					checkIn: bookings.checkIn,
					checkOut: bookings.checkOut,
				})
				.from(bookings)
				.where(eq(bookings.id, data.bookingId))
				.limit(1);

			const checkIn = bookingRow[0]?.checkIn;
			const checkOut = bookingRow[0]?.checkOut;
			if (!checkIn || !checkOut) {
				throw new Error("Booking dates are required for utility payments");
			}

			const periods = listMonthlyBillingPeriods(checkIn, checkOut);
			const period = periods[data.periodIndex];
			if (!period) {
				throw new Error("Invalid billing period");
			}

			const existing = await tx
				.select({
					utilityType: ledgerTransactions.utilityType,
					createdAt: ledgerTransactions.createdAt,
				})
				.from(ledgerTransactions)
				.where(
					and(
						eq(ledgerTransactions.bookingId, data.bookingId),
						eq(ledgerTransactions.category, "UTILITY"),
					),
				);

			const existingMainTypesInPeriod = new Set(
				existing
					.filter(
						(row) => row.createdAt && isWithinPeriod(row.createdAt, period),
					)
					.map((row) => row.utilityType)
					.filter(
						(type): type is "ELECTRICITY" | "WATER" | "INTERNET" =>
							type === "ELECTRICITY" || type === "WATER" || type === "INTERNET",
					),
			);

			const toInsert = payableItems.filter((item) => {
				if (item.utilityType === "OTHER") return true;
				return !existingMainTypesInPeriod.has(item.utilityType);
			});

			if (toInsert.length === 0) {
				await syncBookingPaymentStatus(data.bookingId, tx);
				return { inserted: 0, skipped: payableItems.length };
			}

			const inserted = await tx
				.insert(ledgerTransactions)
				.values(
					toInsert.map((u) => ({
						bookingId: data.bookingId,
						category: "UTILITY" as const,
						amount: u.amount.toFixed(4),
						description: u.description.trim(),
						isPaid: true,
						paymentMethod: data.paymentMethod,
						referenceNumber: normalizeReferenceNumber(
							data.paymentMethod,
							data.referenceNumber,
						),
						utilityType: u.utilityType,
					})),
				)
				.returning();

			await syncBookingPaymentStatus(data.bookingId, tx);

			return {
				inserted: inserted.length,
				skipped: payableItems.length - inserted.length,
			};
		});

		return result;
	});

export const payExpense = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(payExpenseSchema)
	.handler(async ({ data }) => {
		const { transaction, bookingStatus } =
			await getLedgerTransactionWithBooking(data.id, db);

		if (transaction.isPaid) {
			throw new Error("Transaction is already paid");
		}

		if (bookingStatus !== "CHECKED_IN") {
			throw new Error("Payments can only be recorded while checked in");
		}

		const referenceNumber = normalizeReferenceNumber(
			data.paymentMethod,
			data.referenceNumber,
		);

		const updated = await db.transaction(async (tx) => {
			await lockBookingLedger(tx, transaction.bookingId);
			const [row] = await tx
				.update(ledgerTransactions)
				.set({
					isPaid: true,
					paymentMethod: data.paymentMethod,
					referenceNumber,
				})
				.where(eq(ledgerTransactions.id, data.id))
				.returning();

			await syncBookingPaymentStatus(transaction.bookingId, tx);
			return row;
		});

		return updated;
	});

export const payExpensesBulk = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(payExpensesBulkSchema)
	.handler(async ({ data }) => {
		const booking = await getBookingForLedger(data.bookingId, db);
		if (booking.status !== "CHECKED_IN") {
			throw new Error("Payments can only be recorded while checked in");
		}

		const unpaidRows = await db
			.select({ id: ledgerTransactions.id })
			.from(ledgerTransactions)
			.where(
				and(
					eq(ledgerTransactions.bookingId, data.bookingId),
					eq(ledgerTransactions.isPaid, false),
				),
			);

		if (unpaidRows.length === 0) {
			throw new Error("No unpaid transactions to settle");
		}

		const referenceNumber = normalizeReferenceNumber(
			data.paymentMethod,
			data.referenceNumber,
		);

		await db.transaction(async (tx) => {
			await lockBookingLedger(tx, data.bookingId);
			await tx
				.update(ledgerTransactions)
				.set({
					isPaid: true,
					paymentMethod: data.paymentMethod,
					referenceNumber,
				})
				.where(
					and(
						eq(ledgerTransactions.bookingId, data.bookingId),
						eq(ledgerTransactions.isPaid, false),
					),
				);

			await syncBookingPaymentStatus(data.bookingId, tx);
		});

		return { settledCount: unpaidRows.length };
	});

export const payExpenses = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(payExpensesSchema)
	.handler(async ({ data }) => {
		const booking = await getBookingForLedger(data.bookingId, db);
		if (booking.status !== "CHECKED_IN") {
			throw new Error("Payments can only be recorded while checked in");
		}

		const ids = data.items.map((item) => item.id);
		const uniqueIds = new Set(ids);
		if (uniqueIds.size !== ids.length) {
			throw new Error("Duplicate transaction ids in payment request");
		}

		await db.transaction(async (tx) => {
			await lockBookingLedger(tx, data.bookingId);
			for (const item of data.items) {
				const rows = await tx
					.select({
						id: ledgerTransactions.id,
						bookingId: ledgerTransactions.bookingId,
						isPaid: ledgerTransactions.isPaid,
					})
					.from(ledgerTransactions)
					.where(eq(ledgerTransactions.id, item.id))
					.limit(1);

				if (rows.length === 0) {
					throw new Error(`Transaction ${item.id} not found`);
				}
				const row = rows[0];
				if (row.bookingId !== data.bookingId) {
					throw new Error("Transaction does not belong to this booking");
				}
				if (row.isPaid) {
					throw new Error(`Transaction ${item.id} is already paid`);
				}

				const referenceNumber = normalizeReferenceNumber(
					item.paymentMethod,
					item.referenceNumber,
				);

				await tx
					.update(ledgerTransactions)
					.set({
						isPaid: true,
						paymentMethod: item.paymentMethod,
						referenceNumber,
					})
					.where(eq(ledgerTransactions.id, item.id));
			}

			await syncBookingPaymentStatus(data.bookingId, tx);
		});

		return { settledCount: data.items.length };
	});

export const getLedgerDetails = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.validator(getLedgerDetailsSchema)
	.handler(async ({ data }): Promise<LedgerDetails> => {
		const rows = await db
			.select({
				amount: ledgerTransactions.amount,
				isPaid: ledgerTransactions.isPaid,
			})
			.from(ledgerTransactions)
			.where(eq(ledgerTransactions.bookingId, data.bookingId));

		let total = 0;
		let payments = 0;
		let remainingBalance = 0;

		for (const row of rows) {
			const amount = Number(row.amount) || 0;
			total += amount;
			if (row.isPaid) {
				payments += amount;
			} else {
				remainingBalance += amount;
			}
		}

		return { total, payments, remainingBalance };
	});

export const getLedgerTransactions = createServerFn({ method: "GET" })
	.middleware([sessionMiddleware()])
	.validator(getLedgerTransactionsSchema)
	.handler(async ({ data }) => {
		const transactions = await db
			.select()
			.from(ledgerTransactions)
			.where(eq(ledgerTransactions.bookingId, data.bookingId));
		return transactions;
	});

export const deleteLedgerTransaction = createServerFn({ method: "POST" })
	.middleware([sessionMiddleware()])
	.validator(deleteLedgerTransactionSchema)
	.handler(async ({ data }) => {
		const { transaction, bookingStatus } =
			await getLedgerTransactionWithBooking(data.id, db);

		if (transaction.isPaid) {
			throw new Error("Paid transactions cannot be deleted");
		}

		if (bookingStatus !== "CHECKED_IN") {
			throw new Error("Charges can only be removed while checked in");
		}

		if (isProtectedLedgerTransaction(transaction)) {
			throw new Error("This transaction cannot be deleted");
		}

		const deleted = await db.transaction(async (tx) => {
			await lockBookingLedger(tx, transaction.bookingId);
			const [row] = await tx
				.delete(ledgerTransactions)
				.where(eq(ledgerTransactions.id, data.id))
				.returning();

			await syncBookingPaymentStatus(transaction.bookingId, tx);
			return row;
		});

		return deleted;
	});
