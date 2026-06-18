import type { ExtractTablesWithRelations } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { db } from "@/db";
import type * as schema from "@/db/schema";
import { bookings, ledgerTransactions } from "@/db/schema";
import type { PaymentMethod } from "@/db/schema/enums";

export type DbClient =
	| typeof db
	| PgTransaction<
			NodePgQueryResultHKT,
			typeof schema,
			ExtractTablesWithRelations<typeof schema>
	  >;

export {
	isProtectedLedgerTransaction,
	RESERVATION_BALANCE_DESCRIPTION,
	WALK_IN_ROOM_CHARGE_DESCRIPTION,
} from "./ledger.constants";

export function normalizeReferenceNumber(
	paymentMethod: PaymentMethod,
	referenceNumber?: string | null,
): string | null {
	if (paymentMethod === "CASH") return null;
	return referenceNumber?.trim() || null;
}

export async function computeRemainingBalance(
	bookingId: number,
	tx: DbClient,
): Promise<number> {
	const rows = await tx
		.select({
			amount: ledgerTransactions.amount,
			isPaid: ledgerTransactions.isPaid,
		})
		.from(ledgerTransactions)
		.where(eq(ledgerTransactions.bookingId, bookingId));

	let remainingBalance = 0;
	for (const row of rows) {
		if (!row.isPaid) {
			remainingBalance += Number(row.amount) || 0;
		}
	}
	return remainingBalance;
}

export async function syncBookingPaymentStatus(
	bookingId: number,
	tx: DbClient,
): Promise<void> {
	const remainingBalance = await computeRemainingBalance(bookingId, tx);
	const paymentStatus = remainingBalance > 0 ? "CURRENT" : "PAID_IN_FULL";

	await tx
		.update(bookings)
		.set({ paymentStatus })
		.where(eq(bookings.id, bookingId));
}

export async function getBookingForLedger(
	bookingId: number,
	tx: DbClient,
): Promise<{ id: number; status: string; roomId: number }> {
	const rows = await tx
		.select({
			id: bookings.id,
			status: bookings.status,
			roomId: bookings.roomId,
		})
		.from(bookings)
		.where(eq(bookings.id, bookingId))
		.limit(1);

	if (!rows[0]) {
		throw new Error("Booking not found");
	}

	return rows[0];
}

export async function getLedgerTransactionWithBooking(
	transactionId: number,
	tx: DbClient,
) {
	const rows = await tx
		.select({
			transaction: ledgerTransactions,
			bookingStatus: bookings.status,
		})
		.from(ledgerTransactions)
		.innerJoin(bookings, eq(ledgerTransactions.bookingId, bookings.id))
		.where(eq(ledgerTransactions.id, transactionId))
		.limit(1);

	if (!rows[0]) {
		throw new Error("Transaction not found");
	}

	return rows[0];
}

export async function countUnpaidTransactions(
	bookingId: number,
	tx: DbClient,
): Promise<number> {
	const rows = await tx
		.select({ id: ledgerTransactions.id })
		.from(ledgerTransactions)
		.where(
			and(
				eq(ledgerTransactions.bookingId, bookingId),
				eq(ledgerTransactions.isPaid, false),
			),
		);

	return rows.length;
}
