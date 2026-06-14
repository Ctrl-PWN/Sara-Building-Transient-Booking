import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ledgerTransactions } from "@/db/schema";
import type { PaymentMethod } from "@/db/schema/enums";
import {
	getBookingForLedger,
	getLedgerTransactionWithBooking,
	isProtectedLedgerTransaction,
	normalizeReferenceNumber,
	syncBookingPaymentStatus,
} from "./ledger.helpers";
import {
	createExpenseSchema,
	deleteLedgerTransactionSchema,
	getLedgerDetailsSchema,
	getLedgerTransactionsSchema,
	payExpenseSchema,
	payExpensesBulkSchema,
	payExpensesSchema,
} from "./schemas";
import type { LedgerDetails } from "./types";

export const createExpense = createServerFn({ method: "POST" })
	.inputValidator(createExpenseSchema)
	.handler(async ({ data }) => {
		const booking = await getBookingForLedger(data.bookingId, db);
		if (booking.status !== "CHECKED_IN") {
			throw new Error(
				"Charges can only be added while the guest is checked in",
			);
		}

		const isPaid = data.isPaid ?? false;
		const referenceNumber = isPaid
			? normalizeReferenceNumber(
					data.paymentMethod as PaymentMethod,
					data.referenceNumber,
				)
			: null;

		const [row] = await db
			.insert(ledgerTransactions)
			.values({
				bookingId: data.bookingId,
				category: "ROOM_CHARGE",
				amount: String(data.amount),
				description: data.description,
				isPaid,
				paymentMethod: isPaid ? data.paymentMethod : null,
				referenceNumber,
			})
			.returning();

		await syncBookingPaymentStatus(data.bookingId, db);
		return row;
	});

export const payExpense = createServerFn({ method: "POST" })
	.inputValidator(payExpenseSchema)
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

		const [updated] = await db
			.update(ledgerTransactions)
			.set({
				isPaid: true,
				paymentMethod: data.paymentMethod,
				referenceNumber,
			})
			.where(eq(ledgerTransactions.id, data.id))
			.returning();

		await syncBookingPaymentStatus(transaction.bookingId, db);
		return updated;
	});

export const payExpensesBulk = createServerFn({ method: "POST" })
	.inputValidator(payExpensesBulkSchema)
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
	.inputValidator(payExpensesSchema)
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
	.inputValidator(getLedgerDetailsSchema)
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
	.inputValidator(getLedgerTransactionsSchema)
	.handler(async ({ data }) => {
		const transactions = await db
			.select()
			.from(ledgerTransactions)
			.where(eq(ledgerTransactions.bookingId, data.bookingId));
		return transactions;
	});

export const deleteLedgerTransaction = createServerFn({ method: "POST" })
	.inputValidator(deleteLedgerTransactionSchema)
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

		const [deleted] = await db
			.delete(ledgerTransactions)
			.where(eq(ledgerTransactions.id, data.id))
			.returning();

		await syncBookingPaymentStatus(transaction.bookingId, db);
		return deleted;
	});
